export const en = {
  editor: {
    title: "Lyrics Editor",
    description: "Upload lyrics or add them manually",
    alignment: {
      label: "Text Alignment",
      left: "Left",
      center: "Center",
      right: "Right"
    },
    upload: {
      srt: "Upload SRT File",
      audio: "Upload Audio/Video File"
    },
    playback: {
      play: "Play",
      stop: "Stop Playback",
      time_edit_disabled: "Time editing is disabled during playback"
    },
    lyrics: {
      title: "Lyrics List",
      add: "Add Lyrics",
      empty: "No lyrics available",
      time: "Time",
      text: "Lyrics",
      until_end: "Until End"
    },
    dialog: {
      title: "Add New Lyrics",
      edit_title: "Edit Lyrics",
      description: "Enter start time, end time, and lyrics",
      edit_description: "Edit the time and content of the lyrics",
      start_time: "Start Time",
      end_time: "End Time",
      lyrics: "Lyrics",
      lyrics_placeholder: "Enter lyrics",
      cancel: "Cancel",
      add: "Add",
      save: "Save",
      current_time: "Current Playback Time",
      last_lyric_time: "Last Lyrics Time"
    },
    history: {
      undo: "Undo (Ctrl/⌘ + Z)",
      redo: "Redo (Ctrl/⌘ + Shift + Z)"
    },
    menu: {
      file: "File",
      new: "New",
      new_confirm: "Do you want to delete current lyrics and start new?",
      import_srt: "Import SRT File",
      export_srt: "Export as SRT",
      edit: "Edit",
      undo: "Undo",
      redo: "Redo"
    }
  },
  preview: {
    title: "Lyrics Preview",
    mode: {
      label: "Preview Mode",
      apple: "Apple Music Style",
      subtitle: "Subtitle"
    }
  },
  settings: {
    title: "Settings",
    language: {
      label: "Language",
      ko: "한국어",
      en: "English"
    },
    theme: {
      label: "Theme",
      light: "Light Theme",
      dark: "Dark Theme",
      system: "System"
    }
  }
} as const; 