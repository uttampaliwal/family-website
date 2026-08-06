// Design system entry — components, theme engine, and utilities

export { cn } from "./lib/cn.js";

export type { ColorMode, ThemeId } from "@family/core";
export {
  ThemeProvider,
  themeScript,
  useTheme,
} from "./theme/theme-provider.js";

export { Avatar } from "./components/avatar.js";
export { Badge, type BadgeProps } from "./components/badge.js";
export {
  Button,
  buttonVariants,
  type ButtonProps,
} from "./components/button.js";
export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/card.js";
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/dialog.js";
export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./components/dropdown-menu.js";
export { Input } from "./components/input.js";
export { Label } from "./components/label.js";
export { Separator } from "./components/separator.js";
export { Skeleton } from "./components/skeleton.js";
export { Switch } from "./components/switch.js";
export { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/tabs.js";
export { Textarea } from "./components/textarea.js";
export { ToastProvider, useToast } from "./components/toast.js";
