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

const Chats = () => {
  const [output, setOutput] = useState<string>("");
  const [isStarted, setIsStarted] = useState(false);
  const [isStreamFinished, setIsStreamFinished] = useState<boolean>(false);
  const [ReactMarkdown, setReactMarkdown] = useState<any>(null);
  const [remarkGfm, setRemarkGfm] = useState<any>(null);
  const [highlighter, setHighlighter] = useState<any>(null);
  const prompt = 'two paragraphs of a simple story about bunnies'; // Replace with your actual prompt
  const NEWLINE = '$NEWLINE$'
  
  
  const MarkdownComponent: LLMOutputComponent = ({ blockMatch }) => {
    const markdown = blockMatch.output;
    return (
      <ReactMarkdown className={"markdown"} remarkPlugins={[remarkGfm]}>
      {markdown}
      </ReactMarkdown>
    );
  };
  
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
  
  
  
  const startChat = useCallback(() => {
    setIsStarted(true);
    setOutput("");
    
    const eventSource = new EventSource(
      `/answer/api/v1/chat/completion?prompt=${encodeURIComponent(prompt)}`,
    );
    
    eventSource.addEventListener('error', () => eventSource.close());
    
    eventSource.addEventListener("token", (e) => {
      // avoid newlines getting messed up
      const token = e.data.replaceAll(NEWLINE, "\n");
      setOutput((prevResponse) => `${prevResponse}${token}`);
    });
    
    eventSource.addEventListener("finished", (e) => {
      console.log("finished", e);
      eventSource.close();
      setIsStreamFinished(true);
    });
    
    return () => {
      eventSource.close();
    };
  }, [prompt]);
  
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
  
  const { blockMatches } = useLLMOutput({
    llmOutput: output,
    fallbackBlock: {
      component: MarkdownComponent,
      lookBack: markdownLookBack(),
    },
    blocks: [
      {
        component: CodeBlock,
        findCompleteMatch: findCompleteCodeBlock(),
        findPartialMatch: findPartialCodeBlock(),
        lookBack: codeBlockLookBack(),
      },
    ],
    isStreamFinished,
  });
  
  if (!ReactMarkdown || !remarkGfm || !highlighter) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
    <p>Prompt: {prompt}</p>
    {!isStarted && <button onClick={startChat}>Start</button>}
    {blockMatches.map((blockMatch, index) => {
      const Component = blockMatch.block.component;
      return <Component key={index} blockMatch={blockMatch} />;
    })}
    </div>
  );
};

export default Chats;
