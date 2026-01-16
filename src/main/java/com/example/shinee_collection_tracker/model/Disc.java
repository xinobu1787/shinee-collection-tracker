package com.example.shinee_collection_tracker.model;

import lombok.Data;
import jakarta.persistence.*;

/**
 * アルバムの基本情報を管理するEntity。
 * DBの "discs" テーブルに対応します。
 * * [ポイント]
 * セレクトボックスの選択肢として使うため、ID、アーティスト名、タイトルという
 * 最小限の構成に絞って定義しています。
 */
@Entity
@Table(name = "discs") // DBのマスタ名に合わせる
@Data
public class Disc {
    @Id
    private String discId; // アルバム固有のID
    private String artist; // SHINeeやメンバー名
    private String title; // アルバム名（HUNTERなど）

    // 他の項目（releaseDate等）も必要になったら、ここに追加するだけで自動でDBと同期されます
}