export const ko = {
  editor: {
    title: "가사 편집기",
    description: "가사를 편집하고 관리하세요",
    alignment: {
      label: "정렬",
      left: "왼쪽",
      center: "가운데",
      right: "오른쪽"
    },
    upload: {
      srt: "SRT 파일 업로드",
      audio: "오디오/비디오 파일 업로드"
    },
    playback: {
      play: "재생",
      stop: "재생 중지",
      time_edit_disabled: "재생 중에는 시작 시간과 종료 시간을 수정할 수 없습니다."
    },
    lyrics: {
      title: "가사 목록",
      time: "시간",
      text: "가사",
      add: "가사 추가",
      empty: "가사가 없습니다",
      until_end: "끝까지"
    },
    dialog: {
      title: "가사 추가",
      edit_title: "가사 수정",
      description: "새로운 가사를 추가하세요",
      edit_description: "가사의 시간과 내용을 수정하세요",
      start_time: "시작 시간",
      end_time: "종료 시간",
      lyrics: "가사",
      lyrics_placeholder: "가사를 입력하세요",
      cancel: "취소",
      add: "추가",
      save: "저장",
      current_time: "현재 재생 시간",
      last_lyric_time: "마지막 가사 시간"
    },
    history: {
      undo: "실행 취소 (Ctrl/⌘ + Z)",
      redo: "다시 실행 (Ctrl/⌘ + Shift + Z)"
    },
    menu: {
      file: "파일",
      new: "새로 만들기",
      new_confirm: "현재 가사를 삭제하고 새로 시작하시겠습니까?",
      import_srt: "SRT 파일 불러오기",
      export_srt: "SRT 파일로 내보내기",
      edit: "편집",
      undo: "실행 취소",
      redo: "다시 실행"
    }
  },
  preview: {
    title: "가사 미리보기",
    mode: {
      label: "미리보기 모드",
      apple: "애플 뮤직 가사",
      subtitle: "자막"
    }
  },
  settings: {
    title: "설정",
    language: "언어",
    theme: "테마",
    light: "밝은 테마",
    dark: "어두운 테마",
    system: "시스템 설정",
    alignment: "가사 정렬",
    left: "왼쪽 정렬",
    center: "가운데 정렬",
    right: "오른쪽 정렬",
    animation: "애니메이션",
    animation_description: "가사 전환 시 부드러운 애니메이션 효과를 적용합니다."
  }
} as const; 