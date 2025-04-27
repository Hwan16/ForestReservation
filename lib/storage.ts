import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

// 버킷 이름
const BUCKET_NAME = 'forest-images';

// 파일 메타데이터 인터페이스
export interface FileMetadata {
  filename: string;
  contentType: string;
  size: number;
}

/**
 * Supabase Storage 유틸리티
 */
export const storage = {
  /**
   * 스토리지 버킷 초기화
   */
  async initBucket() {
    try {
      // 버킷이 존재하는지 확인
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
      
      // 버킷이 없으면 생성
      if (!bucketExists) {
        const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
          public: true, // 공개 접근 가능
          fileSizeLimit: 10485760, // 10MB 제한
        });
        
        if (error) throw error;
        console.log(`버킷 생성 완료: ${BUCKET_NAME}`);
      }
      
      return { success: true };
    } catch (error) {
      console.error('버킷 초기화 오류:', error);
      return { success: false, error };
    }
  },
  
  /**
   * 파일 업로드
   * @param file 업로드할 파일 (Buffer 또는 Blob)
   * @param path 저장할 경로 (폴더)
   * @param metadata 파일 메타데이터
   * @returns 업로드 결과 및 파일 경로
   */
  async uploadFile(file: Buffer | Blob, path: string, metadata: FileMetadata) {
    try {
      // 고유한 파일명 생성
      const uniqueFileName = `${uuidv4()}-${metadata.filename}`;
      const filePath = `${path}/${uniqueFileName}`;
      
      // 파일 업로드
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          contentType: metadata.contentType,
          cacheControl: '3600',
          upsert: false,
        });
      
      if (error) throw error;
      
      // 공개 URL 생성
      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);
      
      return {
        success: true,
        path: filePath,
        url: publicUrlData.publicUrl,
        metadata: {
          ...metadata,
          path: filePath,
        }
      };
    } catch (error) {
      console.error('파일 업로드 오류:', error);
      return { success: false, error };
    }
  },
  
  /**
   * 파일 삭제
   * @param path 삭제할 파일 경로
   */
  async deleteFile(path: string) {
    try {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([path]);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('파일 삭제 오류:', error);
      return { success: false, error };
    }
  },
  
  /**
   * 파일의 공개 URL 가져오기
   * @param path 파일 경로
   * @returns 공개 URL
   */
  getPublicUrl(path: string) {
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path);
    
    return data.publicUrl;
  },
  
  /**
   * 폴더 내 파일 목록 가져오기
   * @param folder 폴더 경로
   * @returns 파일 목록
   */
  async listFiles(folder: string) {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(folder);
      
      if (error) throw error;
      
      return {
        success: true,
        files: data.map(file => ({
          name: file.name,
          path: `${folder}/${file.name}`,
          size: file.metadata?.size,
          url: this.getPublicUrl(`${folder}/${file.name}`),
          created: file.created_at,
        }))
      };
    } catch (error) {
      console.error('파일 목록 조회 오류:', error);
      return { success: false, error };
    }
  }
};

export default storage; 