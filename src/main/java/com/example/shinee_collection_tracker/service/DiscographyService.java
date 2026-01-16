package com.example.shinee_collection_tracker.service;

import com.example.shinee_collection_tracker.model.Discography;
import com.example.shinee_collection_tracker.repository.DiscographyRepository;
import java.util.Map;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;

/**
 * ディスコグラフィに関するビジネスロジックを担当するサービス。
 * DBから取得したデータをフロントエンドの表示形式に合わせて加工する役割を持ちます。
 */
@Service
public class DiscographyService {

    private final DiscographyRepository repository;

    // Repository（DBとの橋渡し）を読み込みます
    public DiscographyService(DiscographyRepository repository) {
        this.repository = repository;
    }

    public List<Discography> getAllAlbums() {
        return repository.findAll();
    }

    /**
     * マイページの進捗バー（全体・メンバー別・国別）に必要な統計データを集計します。
     * * [処理の流れ]
     * 1. Repositoryから各カテゴリーの購入率（％）を計算したリストを取得。
     * 2. 四捨五入(Math.round)を行い、整数値に整形。
     * 3. JS側でキー名から直接値を参照できるように、Map形式に詰め直して返却。
     * * @return 統計データを含むMap（例: {"total": 80, "Onew": 75, "JP": 90}）
     */
    public Map<String, Object> getCollectionStats() {
        Map<String, Object> stats = new HashMap<>();

        // 1. 全体の購入率を集計
        // DB側で計算済みの浮動小数点数を取得し、フロント表示用に四捨五入する
        double totalRate = repository.getTotalPurchaseRate();
        stats.put("total", Math.round(totalRate));

        // 2. メンバー別の購入率を集計
        // アーティスト名（Key）と進捗率（Value）のペアをMapに格納。
        // これにより、JS側で stats['Key'] のようにアクセス可能になる。
        List<Map<String, Object>> memberRates = repository.getPurchaseRateByArtist();
        for (Map<String, Object> row : memberRates) {
            stats.put((String) row.get("artist"), Math.round(((Number) row.get("rate")).doubleValue()));
        }

        // 3. 国別の購入率を集計
        // メンバー別と同様に、国コードをキーにしてMapに変換。
        List<Map<String, Object>> countryRates = repository.getPurchaseRateByCountry();
        for (Map<String, Object> row : countryRates) {
            stats.put((String) row.get("country"), Math.round(((Number) row.get("rate")).doubleValue()));
        }

        return stats;
    }

    /**
     * 指定されたエディションの所持状況を更新します。
     * Supabase（DB）に対して直接UPDATEクエリを発行するRepositoryメソッドを呼び出します。
     * * @param editionId 対象エディションのID
     * @param isPurchased 購入済みならtrue、未購入ならfalse
     */
    public void updatePurchaseStatus(String editionId, boolean isPurchased) {

        // 保存する（これでSupabaseのデータが書き換わります）
        repository.updatePurchaseStatusNative(editionId, isPurchased);
    }
}