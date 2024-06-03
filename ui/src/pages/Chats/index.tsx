/* eslint-disable */
import React, { useEffect, useState, useCallback } from 'react';
import type { CodeToHtmlOptions } from "@llm-ui/code";

import {
  allLangs,
  allLangsAlias,
  codeBlockLookBack,
  findCompleteCodeBlock,
  findPartialCodeBlock,
  loadHighlighter,
  useCodeBlockToHtml,
} from '@llm-ui/code';

import { markdownLookBack } from "@llm-ui/markdown";
import { useLLMOutput, type LLMOutputComponent } from "@llm-ui/react";
import parseHtml from "html-react-parser";

const Chats: React.FC = () => {
  const [output, setOutput] = useState<string>("");
  const [isStarted, setIsStarted] = useState(false);
  const [isStreamFinished, setIsStreamFinished] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [ReactMarkdown, setReactMarkdown] = useState<any>(null);
  const [remarkGfm, setRemarkGfm] = useState<any>(null);
  const [highlighter, setHighlighter] = useState<any>(null);
  const prompt = 'mic check'; // Replace with your actual prompt
  
  const codeToHtmlOptions: CodeToHtmlOptions = {
    theme: "github-dark",
  };
  
  const CodeBlock: LLMOutputComponent = ({ blockMatch }) => {
    const { html, code } = useCodeBlockToHtml({
      markdownCodeBlock: blockMatch.output,
      highlighter,
      codeToHtmlOptions,
    });
    if (!html) {
      // fallback to <pre> if Shiki is not loaded yet
      return (
        <pre className="shiki">
        <code>{code}</code>
        </pre>
      );
    }
    return <>{parseHtml(html)}</>;
  };
  
  
  useEffect(() => {
    import('react-markdown').then((module) => {
      setReactMarkdown(() => module.default);
    });
    
    import('remark-gfm').then((module) => {
      setRemarkGfm(() => module.default);
    });
    
    Promise.all([
      import('shiki/core'),
      import('shiki/langs'),
      import('shiki/themes'),
      import('shiki/wasm')
    ]).then(([coreModule, langsModule, themesModule, wasmModule]) => {
      const getHighlighterCore = coreModule.getHighlighterCore;
      const bundledLanguagesInfo = langsModule.bundledLanguagesInfo;
      const bundledThemes = themesModule.bundledThemes;
      const getWasm = wasmModule.default;
      
      const highlighterInstance = loadHighlighter(
        getHighlighterCore({
          langs: allLangs(bundledLanguagesInfo),
          langAlias: allLangsAlias(bundledLanguagesInfo),
          themes: Object.values(bundledThemes),
          loadWasm: getWasm,
        })
      );
      
      setHighlighter(highlighterInstance);
    });
  }, []);
  
  const startChat = useCallback(() => {
    const eventSource = new EventSource(
      `/answer/api/v1/chat/completion?prompt=${encodeURIComponent(prompt)}`,
    );
    
    eventSource.addEventListener('error', () => eventSource.close());
    
    eventSource.addEventListener('token', (event: MessageEvent) => {
      setMessage((prevMessage) => prevMessage + event.data);
    });
    
    return () => {
      eventSource.close();
    };
  }, [prompt]);

  
  
  useEffect(() => {
    const cleanupEventSource = startChat();
    return cleanupEventSource;
  }, [startChat]);
  
  if (!ReactMarkdown || !remarkGfm || !highlighter) {
    return <div>Loading...</div>;
  }
  
  const MarkdownComponent: LLMOutputComponent = ({ blockMatch }) => {
    const markdown = blockMatch.output;
    return (
      <ReactMarkdown className={"markdown"} remarkPlugins={[remarkGfm]}>
      {markdown}
      </ReactMarkdown>
    );
  };
  
  
  
  
  return (
    <div>
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message}</ReactMarkdown>
    </div>
  );
};

export default Chats;
