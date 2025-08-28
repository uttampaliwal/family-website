import { z } from "zod";
import { logger } from "./logger.js";

// URL validation schema
const urlSchema = z.string().url("Invalid URL format");

// Configuration for URL validation
interface UrlValidationConfig {
  timeout?: number;
  allowedProtocols?: string[];
  allowedDomains?: string[];
  blockedDomains?: string[];
  maxRedirects?: number;
}

const DEFAULT_CONFIG: Required<UrlValidationConfig> = {
  timeout: 5000, // 5 seconds
  allowedProtocols: ["http:", "https:"],
  allowedDomains: [], // Empty means all domains allowed
  blockedDomains: ["localhost", "127.0.0.1", "0.0.0.0"], // Block local addresses in production
  maxRedirects: 3,
};

export interface UrlValidationResult {
  isValid: boolean;
  isAccessible: boolean;
  statusCode?: number;
  error?: string;
  finalUrl?: string;
  responseTime?: number;
}

/**
 * Validates URL format using Zod schema
 */
export function validateUrlFormat(url: string): {
  isValid: boolean;
  error?: string;
} {
  try {
    urlSchema.parse(url);
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error:
        error instanceof z.ZodError
          ? error.errors[0].message
          : "Invalid URL format",
    };
  }
}

/**
 * Validates URL against security policies
 */
export function validateUrlSecurity(
  url: string,
  config: UrlValidationConfig = {},
): { isValid: boolean; error?: string } {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    const parsedUrl = new URL(url);

    // Check protocol
    if (!mergedConfig.allowedProtocols.includes(parsedUrl.protocol)) {
      return {
        isValid: false,
        error: `Protocol ${parsedUrl.protocol} is not allowed. Allowed protocols: ${mergedConfig.allowedProtocols.join(", ")}`,
      };
    }

    // Check blocked domains
    const hostname = parsedUrl.hostname.toLowerCase();
    if (
      mergedConfig.blockedDomains.some((blocked) => hostname.includes(blocked))
    ) {
      return {
        isValid: false,
        error: `Domain ${hostname} is blocked for security reasons`,
      };
    }

    // Check allowed domains (if specified)
    if (mergedConfig.allowedDomains.length > 0) {
      const isAllowed = mergedConfig.allowedDomains.some(
        (allowed) => hostname === allowed || hostname.endsWith(`.${allowed}`),
      );
      if (!isAllowed) {
        return {
          isValid: false,
          error: `Domain ${hostname} is not in the allowed domains list`,
        };
      }
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: `Invalid URL: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Checks if URL is accessible by making an HTTP request
 */
export async function checkUrlAccessibility(
  url: string,
  config: UrlValidationConfig = {},
): Promise<UrlValidationResult> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const startTime = Date.now();

  try {
    // First validate format and security
    const formatValidation = validateUrlFormat(url);
    if (!formatValidation.isValid) {
      return {
        isValid: false,
        isAccessible: false,
        error: formatValidation.error,
      };
    }

    const securityValidation = validateUrlSecurity(url, config);
    if (!securityValidation.isValid) {
      return {
        isValid: false,
        isAccessible: false,
        error: securityValidation.error,
      };
    }

    // Make HTTP request to check accessibility
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      mergedConfig.timeout,
    );

    try {
      const response = await fetch(url, {
        method: "HEAD", // Use HEAD to avoid downloading content
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent": "URL-Validator/1.0",
        },
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      const result: UrlValidationResult = {
        isValid: true,
        isAccessible: response.ok,
        statusCode: response.status,
        finalUrl: response.url,
        responseTime,
      };

      if (!response.ok) {
        result.error = `HTTP ${response.status}: ${response.statusText}`;
      }

      return result;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        return {
          isValid: true,
          isAccessible: false,
          error: `Request timeout after ${mergedConfig.timeout}ms`,
          responseTime,
        };
      }

      return {
        isValid: true,
        isAccessible: false,
        error: `Network error: ${fetchError instanceof Error ? fetchError.message : "Unknown error"}`,
        responseTime,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error(
      {
        url,
        error:
          error instanceof Error ? error.message : ("Unknown error" as string),
      },
      "URL accessibility check failed",
    );

    return {
      isValid: false,
      isAccessible: false,
      error: `Validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
      responseTime,
    };
  }
}

/**
 * Comprehensive URL validation that checks format, security, and accessibility
 */
export async function validateUrl(
  url: string,
  config: UrlValidationConfig = {},
): Promise<UrlValidationResult> {
  return await checkUrlAccessibility(url, config);
}

/**
 * Validates multiple URLs concurrently
 */
export async function validateUrls(
  urls: string[],
  config: UrlValidationConfig = {},
): Promise<Map<string, UrlValidationResult>> {
  const results = new Map<string, UrlValidationResult>();

  const validationPromises = urls.map(async (url) => {
    const result = await validateUrl(url, config);
    results.set(url, result);
  });

  await Promise.allSettled(validationPromises);
  return results;
}

/**
 * Creates a safe URL for email content with validation
 */
export async function createSafeEmailUrl(
  baseUrl: string,
  path: string,
  params: Record<string, string> = {},
): Promise<{ url: string; isValid: boolean; error?: string }> {
  try {
    const url = new URL(path, baseUrl);

    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const finalUrl = url.toString();
    const validation = await validateUrl(finalUrl, {
      allowedDomains: [new URL(baseUrl).hostname], // Only allow the base domain
      timeout: 3000, // Shorter timeout for email URL validation
    });

    return {
      url: finalUrl,
      isValid: validation.isValid && validation.isAccessible,
      error: validation.error,
    };
  } catch (error) {
    return {
      url: "",
      isValid: false,
      error: `URL construction failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
