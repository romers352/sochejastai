"use client";
import dynamic from "next/dynamic";

export const ClientNavbar = dynamic(() => import("./Navbar"), { ssr: false });
export const ClientFooter = dynamic(() => import("./Footer"), { ssr: false });