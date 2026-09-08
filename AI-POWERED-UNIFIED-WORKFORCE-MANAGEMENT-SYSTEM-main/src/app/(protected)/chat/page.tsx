"use client";

import { useEffect } from "react";

import { FeaturePlaceholder } from "@/components/layout/FeaturePlaceholder";

type ChatbaseFunction = ((...args: unknown[]) => unknown) & {
  q?: unknown[][];
};

type ChatbaseWindow = Window & {
  chatbase?: ChatbaseFunction;
};

export default function ChatPage() {
  useEffect(() => {
    const loadChatbase = () => {
      const win = window as ChatbaseWindow;

      if (!win.chatbase || win.chatbase("getState") !== "initialized") {
        const chatbaseFn: ChatbaseFunction = (...args: unknown[]) => {
          if (!chatbaseFn.q) {
            chatbaseFn.q = [];
          }
          chatbaseFn.q.push(args);
        };

        win.chatbase = new Proxy(chatbaseFn as ChatbaseFunction & Record<string, unknown>, {
          get(target, prop: string | symbol) {
            if (prop === "q") {
              return target.q;
            }

            const value = Reflect.get(target, prop);
            if (typeof value === "function") {
              return (...args: unknown[]) => (value as (...args: unknown[]) => unknown).apply(target, args);
            }

            return value;
          },
        }) as ChatbaseFunction;
      }

      const script = document.createElement("script") as HTMLScriptElement & { domain?: string };
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