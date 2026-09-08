"use client";

import { useEffect } from "react";

import { FeaturePlaceholder } from "@/components/layout/FeaturePlaceholder";

export default function ChatPage() {
  useEffect(() => {
    const loadChatbase = () => {
      if (!window.chatbase || window.chatbase("getState") !== "initialized") {
        window.chatbase = (...args: unknown[]) => {
          if (!window.chatbase.q) {
            window.chatbase.q = [];
          }
          window.chatbase.q.push(args);
        };

        window.chatbase = new Proxy(window.chatbase, {
          get(target: typeof window.chatbase, prop: string) {
            if (prop === "q") {
              return target.q;
            }
            return (...args: unknown[]) => target(prop, ...args);
          },
        });
      }

      const script = document.createElement("script");
      script.src = "https://www.chatbase.co/embed.min.js";
      script.id = "HzkL8HYOwZHxp6UDCpr5o";
      script.domain = "www.chatbase.co";
      document.body.appendChild(script);
    };

    if (document.readyState === "complete") {
      loadChatbase();
    } else {
      window.addEventListener("load", loadChatbase);
    }

    return () => {
      window.removeEventListener("load", loadChatbase);
    };
  }, []);

  return <FeaturePlaceholder title="AI Assistant" description="The assistant workspace will be connected in a later phase. No AI provider is configured yet." />;
}