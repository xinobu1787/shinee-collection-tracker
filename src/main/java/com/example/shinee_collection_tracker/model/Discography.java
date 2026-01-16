package com.example.shinee_collection_tracker.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.persistence.*;

/**
 * ディスコグラフィ情報を保持するEntityクラス。
 * DBのビュー(v_discography)と対応しており、アルバム情報とエディション情報を統合して扱います。
 * * [メモ]
 * @Data : これを書くだけで、全てのGetter/Setter、toString等を自動生成します。
 * @NoArgsConstructor : 引数なしのコンストラクタを自動生成（JPAでの動作に必要）。
 * @AllArgsConstructor : 全ての項目を引数に持つコンストラクタを生成。
 * @Entity : このクラスをデータベースのテーブル（またはビュー）として扱う宣言です。
 * @Table : 対応するDB側の名前を指定します。
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "v_discography")

public class Discography {

    @Id // editionIdを主キー（ID）として設定
    @Column(name = "edition_id")
    private String editionId; 

    // --- discsマスタ由来の項目 ---
    @Column(name = "disc_id")
    private String discId; //D001など

    @Column(name = "artist")
    private String artist; // アーティスト名（SHINee, Onew, Keyなど）

    @Column(name = "title")
    private String title; // アルバムのメインタイトル（例：HUNTER）

    @Column(name = "title_sub")
    private String titleSub; //-1st Mini-など

    @Column(name = "category")
    private String category; //album singleなど

    @Column(name = "country")
    private String country; //国名 jp kr

    @Column(name = "release_date")
    private String releaseDate; // 発売日（ソート順の基準に使用）

    // --- editionsマスタ由来の項目 ---
    @Column(name = "edition_name")
    private String editionName;

    @Column(name = "display_name")
    private String displayName; //形態名 ○○Ver.

    @Column(name = "price")
    private Integer price; //価格　日本のアルバムは公式税抜き価格。韓国のアルバムは平均的な価格として記載。

    @Column(name = "currency")
    private String currency; // jpy krw 価格表示の際に使用

    @Column(name = "remarks")
    private String remarks; //備考欄

    // DB側でtext型などで保存される
    @Column(name = "tracklist", columnDefinition = "TEXT")
    private String tracklist; // 曲目リスト

    @Column(name = "benefit", columnDefinition = "TEXT")
    private String benefit; //特典一覧

    @Column(name = "video_content", columnDefinition = "TEXT")
    private String videoContent; //DVDなどの映像特典内容

    @Column(name = "is_purchased")
    private boolean isPurchased; // 所持フラグ。マイページの進捗バー計算に使用

    @Column(name = "is_wishlist")
    private boolean isWishlist; // 欲しいものリストフラグ


    // --- 手動で定義したGetter/Setter ---
    // boolean型の場合、ライブラリによっては getIsWishlist ではなく 
    // isWishlist() という名前を期待するため、明示的に定義して安全性を高めています。
    
    // Getter
    public boolean isWishlist() {
        return isWishlist;
    }

    // Setter
    public void setWishlist(boolean isWishlist) {
        this.isWishlist = isWishlist;
    }

}