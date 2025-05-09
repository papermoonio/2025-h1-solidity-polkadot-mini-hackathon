// context/LearningContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type View = "editor" | "materials" | "table" | "list";

interface LearningContextType {
  activeView: View;
  setActiveView: (view: View) => void;
}

interface useMarkDownType{
  markdown:string;
  setMarkdown:(markdown:string) => void;
}

const LearningContext = createContext<LearningContextType | undefined>(undefined);
const MarkdownContext =createContext<useMarkDownType | undefined>(undefined);

export function LearningProvider({ children }: { children: ReactNode }) {
  const [activeView, setActiveView] = useState<View>("editor");
  const [markdown,setMarkdown]=useState<string>("")

  return (
    <LearningContext.Provider value={{ activeView, setActiveView }}>
       <MarkdownContext.Provider value={{ markdown, setMarkdown }}>
      {children}
      </MarkdownContext.Provider>
    </LearningContext.Provider>
  );
}

export function useLearning() {
  const context = useContext(LearningContext);
  if (!context) {
    throw new Error("useLearning must be used within a LearningProvider");
  }
  return context;
}

export function useMarkdown() {
  const context = useContext(MarkdownContext);
  if (!context) {
    throw new Error("useMarkdown must be used within a LearningProvide");
  }
  return context;
}

