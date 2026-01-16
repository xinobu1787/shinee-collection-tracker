package com.example.shinee_collection_tracker.controller;

import com.example.shinee_collection_tracker.model.Discography; 
import com.example.shinee_collection_tracker.repository.DiscographyRepository; 
import com.example.shinee_collection_tracker.service.DiscographyService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.Map;

/**
 * @RestController:
 *                  このクラスが「Webからのリクエストを受け取る窓口」であることをSpringに伝えます。
 *                  実行結果は自動的にJSON形式（ブラウザで見やすい形）に変換されます。
 */
@RestController
@RequiredArgsConstructor
public class DiscographyRestController {

    // Finalをつけて、後から変更されないように
    private final DiscographyRepository discographyRepository;
    private final DiscographyService discographyService;

    /**
     * @GetMapping("/api/shinee/discography"):
     * ブラウザで「http://localhost:8080/api/shinee/discography」に
     * アクセスした時に、このメソッドが呼び出されます。
     */
    @GetMapping("/api/shinee/discography")
    public List<Discography> getDiscographyList() {
        // Repositoryの標準機能「findAll()」を使って、DBの全レコードをリストにして返します
        return discographyRepository.findAllCustomOrder();
    }

    /**
     * エディションの所持状況(is_purchased)を更新します。
     * * [動作の流れ]
     * 1. JS側から送られたパスパラメータ(id)と、JSON内の購入フラグを取得。
     * 2. Service層を介してDBの状態を書き換え。
     * * @param editionId 更新対象のID (editionsマスタの主キー)
     * @param payload JSから届く { "isPurchased": true/false } のデータ
     * @return HTTPステータス 200(OK)
     */
    @PatchMapping("/api/editions/{id}/purchase")
    public ResponseEntity<Void> updatePurchaseStatus(
            @PathVariable("id") String editionId,
            @RequestBody Map<String, Boolean> payload) {

        System.out.println("★Javaにリクエストが届きました！ ID: " + editionId);

        // JSから送られてくる { "isPurchased": true } というデータを受け取る
        Boolean isPurchased = payload.get("isPurchased");

        // Serviceに「このエディションを更新して！」と頼む
        discographyService.updatePurchaseStatus(editionId, isPurchased);

        // 「OK、できたよ！」という空の返事を返す
        return ResponseEntity.ok().build();
    }

    /**
     * マイページ表示用の統計データを取得します。
     * * [用途]
     * コレクション全体の総数、メンバー別、国別の進捗率を計算した結果を返します。
     * 円形進捗バーなどのUI描画に使用されます。
     * * @return 統計情報が格納されたMapオブジェクト
     */
    @GetMapping("/api/stats")
    public Map<String, Object> getStats() {
        // Serviceのメソッドを呼び出す
        return discographyService.getCollectionStats();
    }

    /**
     * 欲しいものリスト(wishlist)への追加・削除を切り替えます。
     * トラッカーページで「欲しい」ボタンが押された際に実行されます。
     * * @param id 対象のID
     * @param request JSから届く { "isWishlist": true/false } のデータ
     * @return HTTPステータス 200(OK)
     */
    @PatchMapping("/api/editions/{id}/wishlist")
    public ResponseEntity<Void> toggleWishlist(
            @PathVariable String id,
            @RequestBody Map<String, Boolean> request) {

        boolean isWishlist = request.get("isWishlist");

        // Repositoryのメソッドを呼び出してDBを更新
        discographyRepository.updateWishlistStatus(id, isWishlist);

        return ResponseEntity.ok().build();
    }

    // 欲しいものリストだけの情報を取得するためのエンドポイント
    @GetMapping("/api/editions/wishlist")
    public List<Discography> getWishlist() {
        return discographyRepository.findByIsWishlistTrue();
    }
}
