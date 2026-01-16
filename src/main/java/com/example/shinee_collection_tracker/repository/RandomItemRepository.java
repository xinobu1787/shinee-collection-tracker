package com.example.shinee_collection_tracker.repository;

import com.example.shinee_collection_tracker.model.RandomItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

/**
 * ランダムアイテム情報(random_itemsテーブル)にアクセスするためのリポジトリ。
 */
public interface RandomItemRepository extends JpaRepository<RandomItem, Long> {
    /**
     * 指定したエディションIDに属するアイテムのみを抽出します。
     * 未選択(undefined)の場合は、Controller側でfindAllを呼び出すよう制御しています。
     */
    List<RandomItem> findByEditionId(String editionId);
}