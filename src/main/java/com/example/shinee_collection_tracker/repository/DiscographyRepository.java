package com.example.shinee_collection_tracker.repository;

import com.example.shinee_collection_tracker.model.Discography;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Map;

/**
 * ディスコグラフィ情報のDB操作を担当するリポジトリ。
 * JpaRepositoryを継承し、標準的なCRUD操作に加え、
 * 統計集計やステータス更新のためのカスタムネイティブクエリを定義しています。
 */
@Repository
public interface DiscographyRepository extends JpaRepository<Discography, String> {
    // 発売日（releaseDate）の新しい順、かつID順で取得するように定義
    @Query(value = "SELECT * FROM v_discography ORDER BY release_date DESC, edition_id ASC", nativeQuery = true)
    List<Discography> findAllCustomOrder();

    @Modifying // 更新処理であることを伝える
    @Transactional // トランザクション（失敗したら戻す）をかける
    @Query(value = "UPDATE editions SET is_purchased = :isPurchased WHERE edition_id = :editionId", nativeQuery = true)
    void updatePurchaseStatusNative(String editionId, boolean isPurchased);

    /**
     * コレクション全体の購入率（％）を算出します。
     * * [SQL解説]
     * 1. CASE WHENで購入済み(true)のレコードのみを「1」としてカウント。
     * 2. 全レコード数(COUNT(*))で割り、100を掛けてパーセンテージを算出。
     * 3. 小数点以下を含めた精度で計算し、Service層に返却します。
     */
    @Query(value = "SELECT COUNT(CASE WHEN is_purchased = true THEN 1 END) * 100.0 / COUNT(*) FROM editions", nativeQuery = true)
    double getTotalPurchaseRate();

    /**
     * アーティスト（メンバー）ごとの購入率を算出します。
     * * [SQL解説]
     * 1. discsマスタとeditionsマスタを disc_id で内部結合(JOIN)。
     * 2. アーティスト名ごとにグループ化(GROUP BY)し、それぞれの購入率を計算。
     * 3. 結果はMapのリストとして取得し、Service層で整形します。
     */
    @Query(value = "SELECT d.artist, COUNT(CASE WHEN e.is_purchased = true THEN 1 END) * 100.0 / COUNT(*) as rate " +
            "FROM discs d JOIN editions e ON d.disc_id = e.disc_id " +
            "GROUP BY d.artist", nativeQuery = true)
    List<Map<String, Object>> getPurchaseRateByArtist();

    // 国別の購入率
    @Query(value = "SELECT d.country, COUNT(CASE WHEN e.is_purchased = true THEN 1 END) * 100.0 / COUNT(*) as rate " +
            "FROM discs d JOIN editions e ON d.disc_id = e.disc_id " +
            "GROUP BY d.country", nativeQuery = true)
    List<Map<String, Object>> getPurchaseRateByCountry();

    /**
     * 欲しいものリストの状態を更新します。
     * * @Modifying: SELECT以外の操作（UPDATE/DELETE）を行う場合に必須。
     * @Transactional: DB操作の整合性を保つためのアノテーション。
     */
    @Modifying
    @Transactional
    @Query(value = "UPDATE editions SET is_wishlist = :isWishlist WHERE edition_id = :editionId", nativeQuery = true)
    void updateWishlistStatus(@Param("editionId") String editionId, @Param("isWishlist") boolean isWishlist);

    // 欲しいものリストだけの情報取得
    // nativeQueryではなくJPQL（Javaのオブジェクトを対象にしたクエリ）で書く例
    @Query(value = "SELECT * FROM v_discography WHERE is_Wishlist = true", nativeQuery = true)
    List<Discography> findByIsWishlistTrue();

}