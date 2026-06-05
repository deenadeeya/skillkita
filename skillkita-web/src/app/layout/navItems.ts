import {
  BanknotesIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  HomeIcon,
  PencilSquareIcon,
  RectangleStackIcon,
  UserCircleIcon,
  UsersIcon,
} from "@heroicons/react/24/solid";
import { HiAnnotation } from "react-icons/hi";
import type { NavItem } from "./LeftNav";

export type FlatNavLink = {
  label: string;
  href: string;
};

export function flattenNavLinks(items: NavItem[]): FlatNavLink[] {
  const links: FlatNavLink[] = [];

  const walk = (nodes: NavItem[]) => {
    for (const node of nodes) {
      if (node.href) {
        links.push({ label: node.label, href: node.href });
      }
      if (node.children?.length) {
        walk(node.children);
      }
    }
  };

  walk(items);
  return links;
}

export const adminNavItems: NavItem[] = [
  {
    label: "Home",
    icon: HomeIcon,
    children: [
      { label: "Home Page", href: "/", icon: HomeIcon },
      { label: "About Us", href: "/about-us", icon: DocumentTextIcon },
      {
        label: "Company Experience",
        href: "/company-experience",
        icon: ClipboardDocumentListIcon,
      },
      { label: "Manage Home", href: "/admin/landing", icon: Cog6ToothIcon },
    ],
  },
  {
    label: "Course",
    icon: ClipboardDocumentListIcon,
    children: [
      { label: "Browse Course", href: "/courses", icon: ClipboardDocumentListIcon },
      { label: "Manage Course", href: "/admin", icon: Cog6ToothIcon },
    ],
  },
  {
    label: "Documents",
    icon: RectangleStackIcon,
    children: [
      {
        label: "Quotation",
        icon: RectangleStackIcon,
        children: [
          { label: "Create Quotation", href: "/admin/quotations/create", icon: PencilSquareIcon },
          { label: "Quotation Requests", href: "/admin/quotations", icon: DocumentTextIcon },
        ],
      },
      { label: "JD14", href: "/admin/jd14", icon: DocumentTextIcon },
      { label: "Payment receipt", href: "/admin/payment-receipts", icon: BanknotesIcon },
    ],
  },
  {
    label: "Chat",
    icon: ChatBubbleLeftRightIcon,
    children: [
      { label: "Messages", href: "/admin/messages?role=admin", icon: HiAnnotation },
    ],
  },
  {
    label: "Manage Users",
    icon: Cog6ToothIcon,
    children: [{ label: "Manage Users", href: "/admin/users", icon: UsersIcon }],
  },
  {
    label: "Settings",
    icon: Cog6ToothIcon,
    children: [{ label: "Profile", href: "/admin/profile?role=admin", icon: UserCircleIcon }],
  },
];

export const employerNavItems: NavItem[] = [
  {
    label: "Home",
    icon: HomeIcon,
    children: [
      { label: "Home Page", href: "/", icon: HomeIcon },
      { label: "About Us", href: "/about-us", icon: DocumentTextIcon },
      {
        label: "Company experience",
        href: "/company-experience",
        icon: ClipboardDocumentListIcon,
      },
    ],
  },
  {
    label: "Course",
    icon: ClipboardDocumentListIcon,
    children: [{ label: "Browse Course", href: "/courses", icon: ClipboardDocumentListIcon }],
  },
  {
    label: "Documents",
    icon: RectangleStackIcon,
    children: [
      {
        label: "Quotation",
        icon: RectangleStackIcon,
        children: [
          { label: "Create Quotation", href: "/employer/quotation", icon: PencilSquareIcon },
          { label: "Quotation Requests", href: "/employer", icon: DocumentTextIcon },
        ],
      },
      { label: "JD14", href: "/employer/jd14", icon: DocumentTextIcon },
      { label: "Payment receipt", href: "/employer/payment-receipt", icon: BanknotesIcon },
    ],
  },
  {
    label: "Chat",
    icon: ChatBubbleLeftRightIcon,
    children: [{ label: "Messages", href: "/employer/talk-to-admin", icon: HiAnnotation }],
  },
  {
    label: "Settings",
    icon: Cog6ToothIcon,
    children: [{ label: "Profile", href: "/employer/profile", icon: UserCircleIcon }],
  },
];
