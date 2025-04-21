import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminLoginModal = ({ isOpen, onClose }: AdminLoginModalProps) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const handleLogin = () => {
    // 비밀번호 확인 (비밀번호: "1005")
    if (password === "1005") {
      setError(false);
      
      // 쿠키에 인증 상태 저장
      const expiryDate = new Date();
      expiryDate.setTime(expiryDate.getTime() + 30 * 60 * 1000); // 30분
      document.cookie = `adminAuth=true; expires=${expiryDate.toUTCString()}; path=/`;
      
      toast({
        title: "로그인 성공",
        description: "관리자 페이지로 이동합니다.",
      });
      
      onClose();
      setLocation("/admin");
    } else {
      setError(true);
      toast({
        title: "로그인 실패",
        description: "비밀번호가 일치하지 않습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>관리자 로그인</DialogTitle>
          <DialogDescription>
            관리자 페이지에 접근하기 위해 비밀번호를 입력해주세요.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              비밀번호
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="관리자 비밀번호 입력"
              className={`col-span-3 ${error ? "border-red-500" : ""}`}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleLogin();
                }
              }}
              autoFocus
            />
          </div>
          {error && (
            <div className="text-red-500 text-sm ml-auto col-span-3">
              비밀번호가 일치하지 않습니다.
            </div>
          )}
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleLogin}>로그인</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminLoginModal;