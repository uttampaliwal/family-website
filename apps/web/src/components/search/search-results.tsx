import type { SearchResponse } from "@family/core";
import { Avatar, cn } from "@family/ui";
import { CalendarDays, FileText, Image, MessageCircle, Sparkles, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "../../i18n/index.js";
import type { translations } from "../../i18n/translations.js";

type TKey = keyof typeof translations.en;

type GroupName =
  | "people"
  | "photos"
  | "posts"
  | "events"
  | "documents"
  | "messages";

type GroupItem = SearchResponse[GroupName][number];

/** A single flattened, keyboard-navigable search result. */
export interface SearchItem {
  key: string;
  index: number;
  group: GroupName;
  title: string;
  subtitle: string;
  to: string;
  thumbnail?: string;
}

export const GROUP_ORDER: GroupName[] = [
  "people",
  "photos",
  "posts",
  "events",
  "documents",
  "messages",
];

const groupLabelKeys: Record<GroupName, TKey> = {
  people: "search.group.people",
  photos: "search.group.photos",
  posts: "search.group.posts",
  events: "search.group.events",
  documents: "search.group.documents",
  messages: "search.group.messages",
};

/** Flattens the grouped API response into one ordered row list. */
export function flattenSearchItems(data: SearchResponse): SearchItem[] {
  const items: SearchItem[] = [];
  for (const group of GROUP_ORDER) {
    const list = data[group] as GroupItem[];
    for (const item of list) {
      items.push({
        index: items.length,
        key: `${group}:${item.id}`,
        group,
        ...rowFor(group, item),
      });
    }
  }
  return items;
}

function rowFor(group: GroupName, item: GroupItem): Omit<SearchItem, "key" | "index" | "group"> {
  switch (group) {
    case "people": {
      const member = item as SearchResponse["people"][number];
      return {
        title: member.name,
        subtitle: `@${member.username}`,
        to: `/members/${member.id}`,
      };
    }
    case "photos": {
      const photo = item as SearchResponse["photos"][number];
      return {
        title: photo.caption ?? "Photo",
        subtitle: photo.uploadedBy.name,
        to: "/photos",
        thumbnail: photo.url,
      };
    }
    case "posts": {
      const post = item as SearchResponse["posts"][number];
      return {
        title: post.body,
        subtitle: `${post.createdBy.name} · moments`,
        to: "/moments",
      };
    }
    case "events": {
      const event = item as SearchResponse["events"][number];
      return {
        title: event.title,
        subtitle: new Intl.DateTimeFormat(undefined, {
          dateStyle: "medium",
        }).format(event.startsAt),
        to: "/events",
      };
    }
    case "documents": {
      const document = item as SearchResponse["documents"][number];
      return {
        title: document.name,
        subtitle: document.description ?? document.uploadedBy.name,
        to: "/documents",
      };
    }
    case "messages": {
      const message = item as SearchResponse["messages"][number];
      return {
        title: message.body,
        subtitle: `${message.createdBy.name} · messages`,
        to: `/chat?room=${message.roomId}`,
      };
    }
  }
}

function groupIcon(group: GroupName) {
  switch (group) {
    case "people":
      return <Users className="size-4" />;
    case "photos":
      return <Image className="size-4" />;
    case "posts":
      return <Sparkles className="size-4" />;
    case "events":
      return <CalendarDays className="size-4" />;
    case "documents":
      return <FileText className="size-4" />;
    case "messages":
      return <MessageCircle className="size-4" />;
  }
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

interface SearchResultsProps {
  items: SearchItem[];
  activeIndex?: number;
  onHoverItem?: (index: number) => void;
  withGroupHeaders?: boolean;
}

export function SearchResults({
  items,
  activeIndex = -1,
  onHoverItem,
  withGroupHeaders = true,
}: SearchResultsProps) {
  const { t } = useI18n();
  const groups = new Map<GroupName, SearchItem[]>();
  for (const item of items) {
    const list = groups.get(item.group) ?? [];
    list.push(item);
    groups.set(item.group, list);
  }

  return (
    <div>
      {GROUP_ORDER.filter((group) => groups.has(group)).map((group) => (
        <div key={group}>
          {withGroupHeaders && (
            <p className="flex items-center gap-1.5 px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-muted">
              {groupIcon(group)}
              {t(groupLabelKeys[group])}
            </p>
          )}
          <ul className={withGroupHeaders ? "mt-1" : undefined}>
            {groups.get(group)!.map((item) => (
              <li key={item.key}>
                <Link
                  to={item.to}
                  onMouseEnter={() => onHoverItem?.(item.index)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                    item.index === activeIndex ? "bg-surface-2" : "hover:bg-surface-2/60",
                  )}
                >
                  <ResultThumb item={item} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {item.title}
                    </span>
                    <span className="block truncate text-xs text-muted">{item.subtitle}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function ResultThumb({ item }: { item: SearchItem }) {
  if (item.group === "people") {
    return (
      <Avatar size="sm" src={null}>
        {initials(item.title)}
      </Avatar>
    );
  }
  if (item.group === "photos" && item.thumbnail) {
    return (
      <img
        src={item.thumbnail}
        alt=""
        className="size-9 shrink-0 rounded-lg object-cover"
        loading="lazy"
      />
    );
  }
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted">
      {groupIcon(item.group)}
    </span>
  );
}