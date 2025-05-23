import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface AdminLoginProps {
  onClose: () => void;
  onSuccess: () => void;
  isOpen: boolean;
}

const AdminLogin = ({ onClose, onSuccess, isOpen }: AdminLoginProps) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const { toast } = useToast();

  const handleLogin = () => {
    // 비밀번호 확인 (비밀번호: "1005")
    if (password === "1005") {
      setError(false);
      
      // 관리자 쿠키 설정 - 서버 API 미들웨어와 일치하는 값으로 설정
      document.cookie = "adminAuth=1005; path=/; max-age=86400"; // 24시간 유효
      
      toast({
        title: "로그인 성공",
        description: "관리자 페이지로 이동합니다.",
      });
      onSuccess();
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
              className={`col-span-3 ${error ? 'border-red-500' : ''}`}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleLogin();
                }
              }}
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

export default AdminLogin;