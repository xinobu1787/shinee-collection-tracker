package com.example.shinee_collection_tracker.repository;

import com.example.shinee_collection_tracker.model.Disc; 
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * アルバム情報(discsテーブル)にアクセスするためのリポジトリ。
 */
public interface DiscRepository extends JpaRepository<Disc, String> {
    // 基本的なCRUD操作はJpaRepositoryが提供します
}
