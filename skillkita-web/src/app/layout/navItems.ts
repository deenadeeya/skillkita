import {
  BanknotesIcon,
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
    children: [
      { label: "Home Page", href: "/", icon: HomeIcon },
      { label: "About Us", href: "/about-us", icon: DocumentTextIcon },
      {
        label: "Company Experience",
        href: "/company-experience",
        icon: ClipboardDocumentListIcon,
      },
      { label: "Manage Home", href: "/admin/landing", icon: DocumentTextIcon },
    ],
  },
  {
    label: "Course",
    icon: ClipboardDocumentListIcon,
    children: [
      { label: "Browse Course", href: "/courses", icon: ClipboardDocumentListIcon },
      { label: "Manage Course", href: "/admin", icon: ClipboardDocumentListIcon },
    ],
  },
  {
    label: "Documents",
    icon: DocumentTextIcon,
    children: [
      {
        label: "Quotation",
        icon: DocumentTextIcon,
        children: [
          { label: "Create Quotation", href: "/admin/quotations/create", icon: DocumentTextIcon },
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
      { label: "Messages", href: "/admin/messages?role=admin", icon: ChatBubbleLeftRightIcon },
    ],
  },
  {
    label: "Manage Users",
    icon: UsersIcon,
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
    icon: DocumentTextIcon,
    children: [
      {
        label: "Quotation",
        icon: DocumentTextIcon,
        children: [
          { label: "Create Quotation", href: "/employer/quotation", icon: DocumentTextIcon },
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
    children: [{ label: "Messages", href: "/employer/talk-to-admin", icon: ChatBubbleLeftRightIcon }],
  },
  {
    label: "Settings",
    icon: Cog6ToothIcon,
    children: [{ label: "Profile", href: "/employer/profile", icon: UserCircleIcon }],
  },
];

