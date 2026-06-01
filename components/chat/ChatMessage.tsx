import { Paperclip } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/lib/chat/types";
import { motion } from "motion/react";
import { useState, useEffect } from "react";

export function ChatMessage({ message }: { message: ChatMessageType }) {
  const isUser = message.role === "user";
  
  // Typewriter effect state
  const [displayedContent, setDisplayedContent] = useState("");
  const [displayedBullets, setDisplayedBullets] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Only animate if it's a recently created assistant message that is "done"
    const isAssistantDone = !isUser && message.status === "done";
    const isNewMessage = message.createdAt && (Date.now() - new Date(message.createdAt).getTime() < 2000);
    
    if (isAssistantDone && isNewMessage) {
      setIsTyping(true);
      setDisplayedContent("");
      setDisplayedBullets([]);
      
      let currentIndex = 0;
      const fullText = message.content;
      
      // Animate main text
      const textInterval = setInterval(() => {
        if (currentIndex < fullText.length) {
          // Reveal chunks of 2-4 chars for smoother, faster typing
          const chunk = Math.floor(Math.random() * 3) + 2;
          currentIndex += chunk;
          setDisplayedContent(fullText.slice(0, currentIndex));
        } else {
          clearInterval(textInterval);
          setDisplayedContent(fullText);
          
          // Animate bullets after text finishes
          if (message.bullets && message.bullets.length > 0) {
            let bulletIndex = 0;
            const bulletInterval = setInterval(() => {
              if (bulletIndex < message.bullets!.length) {
                setDisplayedBullets(prev => [...prev, message.bullets![bulletIndex]]);
                bulletIndex++;
              } else {
                clearInterval(bulletInterval);
                setIsTyping(false);
              }
            }, 300); // 300ms delay between each bullet
          } else {
            setIsTyping(false);
          }
        }
      }, 15); // Fast typing speed
      
      return () => {
        clearInterval(textInterval);
      };
    } else {
      // Instant reveal for old messages or user messages
      setDisplayedContent(message.content);
      if (message.bullets) {
        setDisplayedBullets(message.bullets);
      }
    }
  }, [message, isUser]);

  if (!isUser && message.status === "sending") {
    return (
      <article className="flex w-full justify-end" data-role="assistant">
        <div className="flex items-start gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--voltjo-orange)]/10 text-[var(--voltjo-orange)] mt-1">
            <span className="text-[10px] font-black">V</span>
          </div>
          <div className="pt-2.5">
            <div className="flex gap-1.5">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#C9C4BA] [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#C9C4BA] [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#C9C4BA] [animation-delay:300ms]" />
            </div>
            <p className="mt-1 text-[11px] font-medium text-[#6F6A60]">جاري التفكير...</p>
          </div>
        </div>
      </article>
    );
  }

  if (!isUser && message.status === "error") {
    return (
      <article className="flex w-full justify-end" data-role="assistant">
        <div className="max-w-[min(680px,90%)] rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-right text-[13px] font-medium leading-7 text-red-700" dir="rtl">
          {message.content || "حدث خطأ غير متوقع. حاول مرة أخرى."}
        </div>
      </article>
    );
  }

  if (isUser) {
    return (
      <motion.article 
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex w-full justify-start" 
        data-role="user"
      >
        <div className="max-w-[min(680px,90%)] rounded-[20px] bg-[#1F1F1D] px-5 py-3 text-right shadow-sm" dir="rtl">
          {message.attachment && (
            <div className="mb-2 flex w-max items-center gap-2 rounded-lg bg-white/10 px-2.5 py-1.5 text-[11px] font-semibold text-white/80">
              <Paperclip size={11} />
              <span dir="ltr">{message.attachment.name}</span>
            </div>
          )}
          <p className="whitespace-pre-wrap break-words text-[14px] font-medium leading-7 text-white [unicode-bidi:plaintext]">
            {message.content}
          </p>
        </div>
      </motion.article>
    );
  }

  // Assistant message (done state)
  return (
    <motion.article 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex w-full justify-end" 
      data-role="assistant"
    >
      <div className="flex items-start gap-3 max-w-[min(720px,95%)]">
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[var(--voltjo-orange)] shadow-sm border border-[rgba(13,13,13,0.06)]">
          <span className="text-[10px] font-black">V</span>
        </div>
        <div className="min-w-0 flex-1 pt-0.5" dir="rtl">
          {message.attachment && (
            <div className="mb-2.5 flex w-max items-center gap-2 rounded-lg bg-[rgba(13,13,13,0.04)] px-3 py-1.5 text-[11px] font-semibold text-[#6F6A60]">
              <Paperclip size={11} />
              <span dir="ltr">{message.attachment.name}</span>
            </div>
          )}
          <p className="whitespace-pre-wrap break-words text-[14px] font-medium leading-7 text-[#1F1F1D] [unicode-bidi:plaintext]">
            {displayedContent}
            {isTyping && displayedBullets.length === 0 && <span className="inline-block w-1.5 h-3.5 ml-1 bg-[#1F1F1D]/40 animate-pulse align-middle" />}
          </p>
          {displayedBullets.length > 0 ? (
            <ul className="mt-3 space-y-2" dir="rtl">
              {displayedBullets.map((bullet, idx) => (
                <motion.li 
                  key={idx}
                  initial={isTyping ? { opacity: 0, x: 10 } : false}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-2.5 text-[13px] font-medium leading-6 text-[#3A3732]"
                >
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--voltjo-orange)]" aria-hidden="true" />
                  <span className="min-w-0 break-words [unicode-bidi:plaintext]">{bullet}</span>
                </motion.li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}
