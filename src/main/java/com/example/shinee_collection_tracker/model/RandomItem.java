package com.example.shinee_collection_tracker.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * ランダムアイテム（トレカ、ポストカード等）の個別のデータを保持するEntity。
 * データベースの "random_items" テーブルと1対1で対応します。
 * * 【メモ：Lombokアノテーション】
 * @Data : Getter/Setter、toString、equals、hashCodeをすべて自動生成。
 * @NoArgsConstructor : JPAがDBからデータを読み込む際に必要な「引数なしコンストラクタ」を生成。
 * @AllArgsConstructor : 全フィールドをセットできるコンストラクタを生成。
 */
@Entity
@Table(name = "random_items")
@Data                
@NoArgsConstructor   
@AllArgsConstructor  
public class RandomItem {
    
    /**
     * アイテムごとの一意なID。
     * @Id: 主キーであることを示します。
     * @GeneratedValue: DB側で「1, 2, 3...」と自動で番号を振る設定（MySQLのAUTO_INCREMENT等に対応）。
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long itemId;

    /**
     * 紐付くエディションのID。
     * @Column(nullable = false): この項目が空(null)での保存を禁止し、データの整合性を守ります。
     */
    @Column(nullable = false)
    private String editionId; 

    private String itemType;   // アイテムの種別（トレカ、ポストカードなど）
    private String memberName; // メンバー名（ONEW, KEYなど）
    private String imageUrl;   // サーバーに保存した写真の参照用URL

    /**
     * 登録日時。
     * @Column(updatable = false): 一度登録したら、後から更新されないようにロックをかけます。
     * 初期値として LocalDateTime.now() を入れることで、登録瞬間の時間が自動で記録されます。
     */
    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
