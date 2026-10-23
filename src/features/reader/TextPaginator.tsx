import React, { useEffect, useRef, useState } from 'react';
import {
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TextLayoutEventData,
  TextStyle,
  View,
} from 'react-native';

import { TextRange } from './bookText';

interface TextPaginatorProps {
  text: string;
  style: TextStyle;
  /** Inner width of the text column. */
  width: number;
  /** Inner height available for text on one page. */
  height: number;
  lineHeight: number;
  /** Called after every measured chunk with all pages so far. */
  onUpdate: (pages: TextRange[], done: boolean) => void;
}

const INITIAL_CHUNK = 9000;

/**
 * Splits a long text into screen pages, e-reader style.
 *
 * Instead of guessing, the text is laid out off-screen with exactly the
 * reader's typography and `onTextLayout` reports the real line breaks. Lines
 * are grouped into pages of `floor(height / lineHeight)` lines. Long books are
 * measured chunk by chunk: the last (possibly cut) page of every chunk is
 * discarded and re-measured as the start of the next chunk, so page breaks
 * are identical to measuring the whole book at once.
 *
 * Remount (via `key`) to restart when text or typography change.
 */
export function TextPaginator({
  text,
  style,
  width,
  height,
  lineHeight,
  onUpdate,
}: TextPaginatorProps) {
  const [state, setState] = useState({ cursor: 0, chunkSize: INITIAL_CHUNK, done: false });
  const pagesRef = useRef<TextRange[]>([]);
  const handledKey = useRef<string | null>(null);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (text.trim().length === 0) {
      onUpdateRef.current([], true);
      setState((s) => ({ ...s, done: true }));
    }
  }, [text]);

  const { cursor, chunkSize, done } = state;
  const chunkEnd = findChunkEnd(text, cursor, chunkSize);
  const chunk = text.slice(cursor, chunkEnd);
  const key = `${cursor}:${chunkEnd}`;

  const handleLayout = (event: NativeSyntheticEvent<TextLayoutEventData>) => {
    if (handledKey.current === key) return;
    handledKey.current = key;

    const lines = event.nativeEvent.lines;
    const linesPerPage = Math.max(1, Math.floor((height + 0.5) / lineHeight));
    const starts = lineStarts(
      chunk,
      lines.map((l) => l.text),
    );
    const isLast = chunkEnd >= text.length;

    const groups: [number, number][] = [];
    for (let i = 0; i < starts.length; i += linesPerPage) {
      const start = starts[i];
      const end = i + linesPerPage < starts.length ? starts[i + linesPerPage] : chunk.length;
      if (end > start) groups.push([start, end]);
    }

    if (!isLast) {
      if (groups.length <= 1) {
        // Chunk shorter than two pages (huge font) — measure a bigger one.
        setState((s) => ({ ...s, chunkSize: s.chunkSize * 2 }));
        return;
      }
      groups.pop();
    }

    const fresh = groups.map(([start, end]) => ({ start: cursor + start, end: cursor + end }));
    pagesRef.current = pagesRef.current.concat(fresh);
    onUpdateRef.current(pagesRef.current, isLast);

    if (isLast || fresh.length === 0) {
      setState((s) => ({ ...s, done: true }));
    } else {
      setState((s) => ({ ...s, cursor: fresh[fresh.length - 1].end }));
    }
  };

  if (done || chunk.length === 0 || width <= 0 || height <= 0) return null;

  return (
    <View pointerEvents="none" style={[styles.measure, { width }]} collapsable={false}>
      <Text key={key} style={style} allowFontScaling={false} onTextLayout={handleLayout}>
        {chunk}
      </Text>
    </View>
  );
}

/** Ends a chunk at a paragraph (or at least word) boundary. */
export function findChunkEnd(text: string, cursor: number, size: number): number {
  const target = cursor + size;
  if (target >= text.length) return text.length;
  const paragraph = text.indexOf('\n', target);
  if (paragraph !== -1 && paragraph - target < 2000) return paragraph + 1;
  const space = text.indexOf(' ', target);
  return space === -1 ? text.length : space + 1;
}

/**
 * Maps the line strings reported by the layout engine back to offsets in the
 * chunk. Normally the lines concatenate to the chunk exactly; the resync
 * handles platforms that drop a trailing newline or whitespace.
 */
export function lineStarts(chunk: string, lineTexts: string[]): number[] {
  const starts: number[] = [];
  let pos = 0;
  for (const lineText of lineTexts) {
    if (lineText.length === 0) continue;
    if (!chunk.startsWith(lineText, pos)) {
      const probe = lineText.trimEnd().slice(0, 16);
      const idx = probe ? chunk.indexOf(probe, pos) : -1;
      if (idx !== -1 && idx - pos < 64) pos = idx;
    }
    starts.push(Math.min(pos, chunk.length));
    pos += lineText.length;
  }
  return starts;
}

const styles = StyleSheet.create({
  measure: { position: 'absolute', left: 0, top: 0, opacity: 0 },
});
