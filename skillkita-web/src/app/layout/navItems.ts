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
      { label: "Course", href: "/courses", icon: ClipboardDocumentListIcon },
    ],
  },
  {
    label: "Documents",
    icon: RectangleStackIcon,
    children: [
      { label: "Create Quotation", href: "/admin/quotations/create", icon: PencilSquareIcon },
      { label: "Quotation Requests", href: "/admin/quotations", icon: DocumentTextIcon },
      { label: "JD14", href: "/admin/jd14", icon: DocumentTextIcon },
      { label: "Payment Receipt", href: "/admin/payment-receipts", icon: BanknotesIcon },
    ],
  },
  {
    label: "Messages",
    href: "/admin/messages?role=admin",
    icon: ChatBubbleLeftRightIcon,
  },
  {
    label: "Settings",
    icon: Cog6ToothIcon,
    children: [
      { label: "Homepage CMS", href: "/admin/landing", icon: HomeIcon },
      { label: "Manage Course", href: "/admin", icon: ClipboardDocumentListIcon },
      { label: "Manage Users", href: "/admin/users", icon: UsersIcon },
      { label: "Profile", href: "/admin/profile?role=admin", icon: UserCircleIcon },
    ],
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
        label: "Company Experience",
        href: "/company-experience",
        icon: ClipboardDocumentListIcon,
      },
      { label: "Course", href: "/courses", icon: ClipboardDocumentListIcon },
    ],
  },
  {
    label: "Documents",
    icon: RectangleStackIcon,
    children: [
      { label: "Create Quotation", href: "/employer/quotation", icon: PencilSquareIcon },
      { label: "Quotation Requests", href: "/employer", icon: DocumentTextIcon },
      { label: "JD14", href: "/employer/jd14", icon: DocumentTextIcon },
      { label: "Payment Receipt", href: "/employer/payment-receipt", icon: BanknotesIcon },
    ],
  },
  {
    label: "Talk to Admin",
    href: "/employer/talk-to-admin",
    icon: ChatBubbleLeftRightIcon,
  },
  {
    label: "Settings",
    icon: Cog6ToothIcon,
    children: [{ label: "Profile", href: "/employer/profile", icon: UserCircleIcon }],
  },
];
