package com.example.shinee_collection_tracker.controller;

import lombok.RequiredArgsConstructor;
import com.example.shinee_collection_tracker.model.Disc;
import com.example.shinee_collection_tracker.model.Edition;
import com.example.shinee_collection_tracker.repository.DiscRepository;
import com.example.shinee_collection_tracker.repository.EditionRepository;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

/**
 * マスタデータ（Disc情報、Edition情報）を提供するためのコントローラー。
 * 主にランダムアイテム管理画面などの、セレクトボックス（ドロップダウン）の選択肢を取得するために使用します。
 */
@RestController
@RequestMapping("/api/master")
@RequiredArgsConstructor // finalフィールドのコンストラクタを自動生成（Lombok）
public class MasterDataController {

    private final DiscRepository discRepository;
    private final EditionRepository editionRepository;

    /**
     * 全てのアルバム（Disc）情報を取得します。
     * ランダムアイテム登録時の「アルバム選択」プルダウンに使用されます。
     * * @return アルバム情報のリスト（disc_id, titleなど）
     */
    @GetMapping("/discs")
    public List<Disc> getAllDiscs() {
        // 全てのアルバムデータをDBから取得して返却
        return discRepository.findAll();
    }


    /**
     * 指定されたアルバムIDに紐づく、形態（Edition）一覧を取得します。
     * * [動作の流れ]
     * アルバム選択プルダウンが変更された際、そのIDを元にこのAPIが呼ばれ、
     * 該当するアルバムの形態（通常盤、初回限定盤など）のみをリストアップします。
     * * @param discId フロントエンドから送られるアルバムID
     * @return 該当するアルバムに所属するエディションのリスト
     */
    @GetMapping("/editions")
    public List<Edition> getEditions(@RequestParam String discId) {
        // クエリパラメータ (?discId=xxx) を受け取り、Repositoryで絞り込み検索を実行
        return editionRepository.findByDiscId(discId);
    }
}