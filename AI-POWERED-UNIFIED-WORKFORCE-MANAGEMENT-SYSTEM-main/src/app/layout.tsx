import type { Metadata } from "next";
import "./globals.css";

import { AuthProvider } from "@/lib/auth/AuthProvider";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import ChatbotDragController from "@/components/ChatbotDragController";

export const metadata: Metadata = {
  title: "workforceOS - AI-Powered Workforce Management System",
  description: "Enterprise Workforce Management, Scheduling, and Operational Intelligence",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ThemeProvider>
            <I18nProvider>{children}</I18nProvider>
          </ThemeProvider>
        </AuthProvider>

        {/* Chatbase Chatbot Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){if(!window.chatbase||window.chatbase("getState")!=="initialized"){window.chatbase=(...arguments)=>{if(!window.chatbase.q){window.chatbase.q=[]}window.chatbase.q.push(arguments)};window.chatbase=new Proxy(window.chatbase,{get(target,prop){if(prop==="q"){return target.q}return(...args)=>target(prop,...args)}})}const onLoad=function(){const script=document.createElement("script");script.src="https://www.chatbase.co/embed.min.js";script.id="HzkL8HYOwZHxp6UDCpr5o";script.domain="www.chatbase.co";document.body.appendChild(script)};if(document.readyState==="complete"){onLoad()}else{window.addEventListener("load",onLoad)}})();
            `
          }}
        />

        {/* Makes the Chatbase launcher movable via double-click (desktop) / long-press (mobile) */}
        <ChatbotDragController />
      </body>
    </html>
  );
}