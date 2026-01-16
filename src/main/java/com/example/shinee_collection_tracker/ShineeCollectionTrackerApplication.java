package com.example.shinee_collection_tracker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;


/**
 * SHINee Collection Tracker アプリケーションの起動クラス。
 * * このクラスを実行することで、内蔵されたTomcatサーバが立ち上がり、
 * フロントエンド(JS)からのリクエストを受け付けられるようになります。
 */
@SpringBootApplication
public class ShineeCollectionTrackerApplication {

	/**
     * Javaプログラムのメインエントリーポイント。
     * * [実行時に行われること]
     * 1. @SpringBootApplicationアノテーションにより、プロジェクト内のコンポーネント
     * (Controller, Service, Repository等)を自動的にスキャンして登録。
     * 2. DB(Supabase)への接続設定を読み込み、連携を確立。
     * 3. アプリをWebサーバとして起動。
     */
	public static void main(String[] args) {
		// SpringApplication.run() を通じて、Spring Bootの魔法が開始される
		SpringApplication.run(ShineeCollectionTrackerApplication.class, args);
	}

}
