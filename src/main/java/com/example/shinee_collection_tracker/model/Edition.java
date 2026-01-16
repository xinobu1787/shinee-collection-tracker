package com.example.shinee_collection_tracker.model;

import lombok.Data;
import jakarta.persistence.*;

/**
 * 各アルバムに紐づく形態（通常盤、初回限定盤など）の情報を管理するEntity。
 * DBの "editions" テーブルに対応します。
 */
@Entity
@Table(name = "editions") // DBのマスタ名に合わせる
@Data
public class Edition {
    @Id
    private String editionId; // 形態ごとの固有ID（D001-01など）

    /**
     * 親となるアルバムのID。
     * これがあることで、「どのアルバムの形態か」を特定できます。
     */
    private String discId;    // D001

    private String editionName; // 形態の簡易的な名称
    private String displayName; // 画面に表示する用の名前
}