'use client';

import React from "react";
import styles from "../app/page.module.css";

interface LyricLine {
  start: number;
  end?: number;
  text: string;
}

interface SubtitlePreviewProps {
  lyrics: LyricLine[];
  activeLyricIndex: number;
}

const SubtitlePreview: React.FC<SubtitlePreviewProps> = ({
  lyrics,
  activeLyricIndex
}) => {
  return (
    <div className={styles.subtitlePreview}>
      {activeLyricIndex !== -1 ? lyrics[activeLyricIndex]?.text : ""}
    </div>
  );
};

export default SubtitlePreview; 