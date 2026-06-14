import React from "react";
import Sidebar from "@/components/Sidebar";
import { motion } from "framer-motion";

export default function Shell({ title, subtitle, action, children }) {
  return (
    <div className="flex min-h-screen">
      <div className="mesh-bg" />
      <Sidebar />
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 px-10 py-6 glass-light border-b border-black/5 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-[#5C5C5C] mt-1">{subtitle}</p>}
          </div>
          {action}
        </header>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="px-10 py-8"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
