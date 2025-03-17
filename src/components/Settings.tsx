import { Settings as SettingsIcon, Moon, Sun, AlignLeft, AlignCenter, AlignRight, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Label } from './ui/label';
import { getText, Language } from '@/i18n';
import { useTheme } from 'next-themes';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

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
          <div className="space-y-4">
            <Label className="text-base">{t.settings.language}</Label>
            <RadioGroup 
              value={language} 
              onValueChange={(value) => onLanguageChange(value as Language)}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ko" id="ko" />
                <Label htmlFor="ko" className="font-normal">한국어</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="en" id="en" />
                <Label htmlFor="en" className="font-normal">English</Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* 테마 설정 */}
          <div className="space-y-4">
            <Label className="text-base">{t.settings.theme}</Label>
            <RadioGroup 
              value={theme || 'system'} 
              onValueChange={setTheme}
              className="grid grid-cols-3 gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="light" />
                <Label htmlFor="light" className="font-normal">
                  <Sun className="h-4 w-4 inline-block mr-2" />
                  {t.settings.light}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="dark" />
                <Label htmlFor="dark" className="font-normal">
                  <Moon className="h-4 w-4 inline-block mr-2" />
                  {t.settings.dark}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="system" />
                <Label htmlFor="system" className="font-normal">{t.settings.system}</Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* 가사 정렬 설정 */}
          <div className="space-y-4">
            <Label className="text-base">{t.settings.alignment}</Label>
            <RadioGroup 
              value={alignment} 
              onValueChange={(value) => onAlignmentChange(value as typeof alignment)}
              className="grid grid-cols-3 gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="textAlignLeft" id="left" />
                <Label htmlFor="left" className="font-normal">
                  <AlignLeft className="h-4 w-4 inline-block mr-2" />
                  {t.settings.left}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="textAlignCenter" id="center" />
                <Label htmlFor="center" className="font-normal">
                  <AlignCenter className="h-4 w-4 inline-block mr-2" />
                  {t.settings.center}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="textAlignRight" id="right" />
                <Label htmlFor="right" className="font-normal">
                  <AlignRight className="h-4 w-4 inline-block mr-2" />
                  {t.settings.right}
                </Label>
              </div>
            </RadioGroup>
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