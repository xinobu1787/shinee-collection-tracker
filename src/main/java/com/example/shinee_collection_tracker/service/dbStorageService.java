package com.example.shinee_collection_tracker.service;

import okhttp3.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.UUID;

@Service
public class dbStorageService {
    // Railwayの環境変数から取得
    private final String SUPABASE_URL = System.getenv("SB_URL");
    private final String SUPABASE_KEY = System.getenv("SB_KEY");
    private final String BUCKET_NAME = "RandomItem"; // 先ほど作成したバケット名

    public String uploadImage(MultipartFile file) throws IOException {
        // 1. ファイル名が重複しないよう、UUIDを使って一意のファイル名を生成
        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String fileName = UUID.randomUUID().toString() + extension;

        // 2. Supabase StorageのAPIエンドポイントURLを作成
        // 形式: {URL}/storage/v1/object/{bucket}/{path}
        String uploadUrl = SUPABASE_URL + "/storage/v1/object/" + BUCKET_NAME + "/" + fileName;

        OkHttpClient client = new OkHttpClient();

        // 3. 画像データをリクエストボディに変換
        RequestBody body = RequestBody.create(
            file.getBytes(),
            MediaType.parse(file.getContentType())
        );

        // 4. POSTリクエストを組み立てる
        Request request = new Request.Builder()
                .url(uploadUrl)
                .header("Authorization", "Bearer " + SUPABASE_KEY) // APIキー（Service Role）
                .header("apikey", SUPABASE_KEY)
                .post(body)
                .build();

        // 5. 実行
        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Supabaseへのアップロードに失敗しました: " + response);
            }

            // 6. 公開URLを生成して返す
            // 公開設定（RLS）にしているので、このURLでブラウザから直接閲覧可能
            return SUPABASE_URL + "/storage/v1/object/public/" + BUCKET_NAME + "/" + fileName;
        }
    }
}
