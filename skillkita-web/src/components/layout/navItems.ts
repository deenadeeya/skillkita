import {
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  HomeIcon,
  UserCircleIcon,
  UsersIcon,
} from "@heroicons/react/24/solid";
import type { NavItem } from "./LeftNav";

export const adminNavItems: NavItem[] = [
  {
    label: "Home",
    icon: HomeIcon,
    children: [{ label: "Landing Page", href: "/", icon: HomeIcon }],
  },
  {
    label: "Dashboard",
    icon: HomeIcon,
    children: [
      { label: "Manage Course", href: "/admin", icon: ClipboardDocumentListIcon },
      { label: "Manage Landing Page", href: "/admin/landing", icon: DocumentTextIcon },
    ],
  },
  {
    label: "Customers",
    icon: UsersIcon,
    children: [{ label: "Manage Users", href: "/admin/users", icon: UsersIcon }],
  },
  {
    label: "Quotations",
    icon: DocumentTextIcon,
    children: [{ label: "Requests", href: "/admin/quotations", icon: DocumentTextIcon }],
  },
  {
    label: "Communication",
    icon: ChatBubbleLeftRightIcon,
    children: [{ label: "Messages", href: "/admin/messages?role=admin", icon: ChatBubbleLeftRightIcon }],
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
    children: [{ label: "Landing Page", href: "/", icon: HomeIcon }],
  },
  {
    label: "Employer",
    icon: HomeIcon,
    children: [
      { label: "Documents", href: "/employer", icon: DocumentTextIcon },
      { label: "Quotation", href: "/employer/quotation", icon: ClipboardDocumentListIcon },
      { label: "Talk to Admin", href: "/employer/talk-to-admin", icon: ChatBubbleLeftRightIcon },
    ],
  },
  {
    label: "Settings",
    icon: Cog6ToothIcon,
    children: [{ label: "Profile", href: "/employer/profile", icon: UserCircleIcon }],
  },
];

