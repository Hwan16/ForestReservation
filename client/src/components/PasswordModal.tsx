import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PasswordModal = ({ isOpen, onClose }: PasswordModalProps) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  const handleSubmit = () => {
    if (password === "1005") {
      // 비밀번호가 맞으면 관리자 페이지로 이동
      toast({
        title: "로그인 성공",
        description: "관리자 페이지로 이동합니다.",
      });
      
      // 쿠키를 설정하여 30분 동안 인증 유지
      const date = new Date();
      date.setTime(date.getTime() + 30 * 60 * 1000); // 30분
      document.cookie = `adminAuth=true; expires=${date.toUTCString()}; path=/;`;
      
      onClose();
      navigate("/admin");
    } else {
      // 비밀번호가 틀리면 오류 메시지 표시
      setError(true);
      toast({
        variant: "destructive",
        title: "비밀번호 오류",
        description: "관리자 비밀번호가 올바르지 않습니다.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>관리자 로그인</DialogTitle>
          <DialogDescription>
            관리자 페이지에 접속하려면 비밀번호를 입력하세요.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Input
              id="password"
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              className={error ? "border-red-500" : ""}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmit();
                }
              }}
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-500">
                비밀번호가 올바르지 않습니다.
              </p>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSubmit}>확인</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordModal;