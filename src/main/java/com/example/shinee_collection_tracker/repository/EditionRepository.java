package com.example.shinee_collection_tracker.repository;

import com.example.shinee_collection_tracker.model.Edition; 
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

/**
 * 形態情報(editionsテーブル)にアクセスするためのリポジトリ。
 */
public interface EditionRepository extends JpaRepository<Edition, String> {
    /**
     * 特定のアルバムIDに紐づくエディション一覧を取得します。
     * ランダムアイテム登録画面の「形態選択」の連動に使用します。
     */
    List<Edition> findByDiscId(String discId);
}
