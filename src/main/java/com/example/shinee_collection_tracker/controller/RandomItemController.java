package com.example.shinee_collection_tracker.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.example.shinee_collection_tracker.model.RandomItem;
import com.example.shinee_collection_tracker.repository.RandomItemRepository;
import com.example.shinee_collection_tracker.service.dbStorageService;

import java.util.List;

/**
 * ランダムアイテム（トレカ・ポストカード等）の管理を担当するコントローラー。
 * 画像ファイルのアップロード処理と、そのメタデータのDB保存を同期して行います。
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/random")
public class RandomItemController {

    private final RandomItemRepository randomItemRepository;
    private final dbStorageService dbStorageService;

    /**
     * ランダムアイテムを画像と一緒に一括登録します。
     * * [処理の流れ]
     * 1. サーバー内の保存先パス(static/uploads/random)を決定。
     * 2. フォルダが存在しない場合は自動作成。
     * 3. 画像ファイルを1枚ずつループで処理し、サーバーへ物理保存。
     * 4. 同時に、画像のURLやアイテム情報をDB(random_itemsマスタ)に保存。
     * * @param discId アルバムID
     * 
     * @param editionId   形態ID
     * @param names       アイテム種別（トレカ等）のリスト
     * @param memberNames メンバー名のリスト
     * @param images      画像ファイルのリスト
     * @return 実行結果メッセージ
     */
    @PostMapping("/upload")
    public ResponseEntity<String> upload(
            @RequestParam("discId") String discId,
            @RequestParam("editionId") String editionId,
            @RequestParam("names") List<String> names,
            @RequestParam("memberNames") List<String> memberNames, // JSから届く！
            @RequestParam("images") List<MultipartFile> images) {

        try {

            for (int i = 0; i < names.size(); i++) {
                MultipartFile file = images.get(i);
                if (file.isEmpty())
                    continue;

                // --- 変更点：Supabase Storageへアップロード ---
                // 内部でUUIDを使ってユニークなファイル名にして、https://... のURLを返す
                String publicUrl = dbStorageService.uploadImage(file);

                // --- EntityにセットしてDB保存 ---
                RandomItem item = new RandomItem();
                item.setEditionId(editionId);
                item.setItemType(names.get(i));
                item.setMemberName(memberNames.get(i));

                // ★重要：以前の相対パス "/uploads/..." ではなく、
                // Supabaseから返ってきた「フルURL」をそのままDBに保存します！
                item.setImageUrl(publicUrl);

                randomItemRepository.save(item); // ここでDBに刻まれる！
            }

            return ResponseEntity.ok("Supabase Storage & DBへの保存成功！画像数: " + images.size());

        } catch (Exception e) {
            // 失敗時は原因を特定できるようスタックトレースを出力
            e.printStackTrace();
            return ResponseEntity.status(500).body("保存中にエラー: " + e.getMessage());
        }
    }

    /**
     * 登録済みのランダムアイテム一覧を取得します。
     * 特定のエディションで絞り込むことも可能です。
     * * @param editionId 絞り込みたいエディションID（未指定や"undefined"の場合は全件取得）
     * 
     * @return アイテムリスト
     */
    @GetMapping("/items")
    public List<RandomItem> getItems(@RequestParam(required = false) String editionId) {
        // JS側から "undefined" という文字列が送られてくる可能性を考慮した安全なガード節
        if (editionId == null || editionId.isEmpty() || editionId.equals("undefined")) {
            return randomItemRepository.findAll();
        }
        // 特定のエディションに紐づくアイテムだけを抽出
        return randomItemRepository.findByEditionId(editionId);
    }
}