import { Settings as SettingsIcon, Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { getText, Language } from '@/i18n';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SettingsProps {
  language: Language;
  onLanguageChange: (language: Language) => void;
  alignment: "textAlignLeft" | "textAlignCenter" | "textAlignRight";
  onAlignmentChange: (alignment: "textAlignLeft" | "textAlignCenter" | "textAlignRight") => void;
  showAnimation: boolean;
  onAnimationChange: (show: boolean) => void;
}

export function Settings({ 
  language, 
  onLanguageChange,
  alignment,
  onAlignmentChange,
  showAnimation,
  onAnimationChange
}: SettingsProps) {
  const t = getText(language);
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <SettingsIcon className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">설정 열기</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>설정</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground px-2">
            언어
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onLanguageChange('ko')}>
            {language === 'ko' && '✓ '}한국어
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onLanguageChange('en')}>
            {language === 'en' && '✓ '}English
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground px-2">
            가사 정렬
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onAlignmentChange('textAlignLeft')}>
            {alignment === 'textAlignLeft' && '✓ '}왼쪽 정렬
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAlignmentChange('textAlignCenter')}>
            {alignment === 'textAlignCenter' && '✓ '}가운데 정렬
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAlignmentChange('textAlignRight')}>
            {alignment === 'textAlignRight' && '✓ '}오른쪽 정렬
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground px-2">
            애니메이션
          </DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onAnimationChange(true)}>
            {showAnimation && '✓ '}애니메이션 켜기
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAnimationChange(false)}>
            {!showAnimation && '✓ '}애니메이션 끄기
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 