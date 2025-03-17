import { Settings as SettingsIcon, Moon, Sun, AlignLeft, AlignCenter, AlignRight, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Label } from './ui/label';
import { getText, Language } from '@/i18n';
import { useTheme } from 'next-themes';
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <SettingsIcon className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">설정 열기</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t.settings.title}</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 py-6">
          {/* 언어 설정 */}
          <div className="space-y-2">
            <Label className="text-base">{t.settings.language}</Label>
            <Select value={language} onValueChange={(value) => onLanguageChange(value as Language)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="언어 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ko">한국어</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* 테마 설정 */}
          <div className="space-y-2">
            <Label className="text-base">{t.settings.theme}</Label>
            <Select value={theme || 'system'} onValueChange={setTheme}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="테마 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center">
                    <Sun className="h-4 w-4 mr-2" />
                    <span>{t.settings.light}</span>
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center">
                    <Moon className="h-4 w-4 mr-2" />
                    <span>{t.settings.dark}</span>
                  </div>
                </SelectItem>
                <SelectItem value="system">{t.settings.system}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* 가사 정렬 설정 */}
          <div className="space-y-2">
            <Label className="text-base">{t.settings.alignment}</Label>
            <Select value={alignment} onValueChange={(value) => onAlignmentChange(value as typeof alignment)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="정렬 방식 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="textAlignLeft">
                  <div className="flex items-center">
                    <AlignLeft className="h-4 w-4 mr-2" />
                    <span>{t.settings.left}</span>
                  </div>
                </SelectItem>
                <SelectItem value="textAlignCenter">
                  <div className="flex items-center">
                    <AlignCenter className="h-4 w-4 mr-2" />
                    <span>{t.settings.center}</span>
                  </div>
                </SelectItem>
                <SelectItem value="textAlignRight">
                  <div className="flex items-center">
                    <AlignRight className="h-4 w-4 mr-2" />
                    <span>{t.settings.right}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* 애니메이션 설정 */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">{t.settings.animation}</Label>
              <p className="text-sm text-muted-foreground">
                {t.settings.animation_description}
              </p>
            </div>
            <Switch
              checked={showAnimation}
              onCheckedChange={onAnimationChange}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
} 