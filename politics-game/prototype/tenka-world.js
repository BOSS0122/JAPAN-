// 『永田町への道 天下取り』 世界のデータ：争点、団体、官庁、メディア、名前のある人物、秘書、シナリオ、危機
// すべて架空。実在の人物・団体とは関係ない。
(() => {
  const T = (globalThis.Tenka = globalThis.Tenka || {});
  T.W = {
    // 争点。stance は -2〜+2。a が「-」側、b が「+」側の主張。
    issues: [
      { id: "keiki", name: "景気・物価", a: "給付と減税で家計を支える", b: "財政規律を守る", nation: { econ: 1, debt: 1 } },
      { id: "kosodate", name: "子育て・教育", a: "教育無償化を広げる", b: "まず財源を確保する", nation: { birth: 1, debt: 1 } },
      { id: "bouei", name: "防衛", a: "専守防衛を堅持する", b: "防衛費を大きく増やす", nation: { debt: 1 } },
      { id: "genpatsu", name: "原発", a: "段階的にやめる", b: "再稼働を進める", nation: { price: 1 } },
      { id: "shouhizei", name: "消費税", a: "引き下げる", b: "現状維持または引き上げ", nation: { econ: 1, debt: 1 } },
      { id: "kenpou", name: "憲法改正", a: "改正しない", b: "改正を発議する", nation: {} },
      { id: "chihou", name: "地方と公共事業", a: "公共事業を絞る", b: "地方に予算を回す", nation: { debt: 1 } },
      { id: "nenkin", name: "年金・医療", a: "給付を守り負担は企業へ", b: "給付を見直し現役世代の負担を減らす", nation: { debt: 1 } },
    ],

    // 地域ごとの「有権者の好み」（stance の方向）と関心の重み
    // rural: 人口130万人未満、urban: 500万人以上
    regionalLean: {
      rural: { chihou: 1.5, genpatsu: 0.3, nenkin: 0.8, keiki: -0.5 },
      mid: { kosodate: 0.3, keiki: -0.5, chihou: 0.4 },
      urban: { chihou: -0.8, kosodate: -0.6, shouhizei: -0.6, kenpou: -0.3 },
      okinawa: { bouei: -1.8, kenpou: -1.0 },
      energy: { genpatsu: 1.2 },        // 福井・福島・新潟など
    },
    energyPrefs: ["fukui", "fukushima", "niigata", "ehime", "saga", "kagoshima", "shimane", "aomori"],

    // 派閥・政党の立場（AI が法案と選挙で使う）
    factionStances: {
      ookouchi: { chihou: 2, kenpou: 1, bouei: 1, nenkin: 1, keiki: -1 },
      kiryu: { keiki: 1, shouhizei: 1, nenkin: 1, chihou: 0, kosodate: 1 },
      isurugi: { kosodate: -2, genpatsu: -1, shouhizei: -1, kenpou: 0 },
      minsei: { kosodate: -2, shouhizei: -2, kenpou: -2, genpatsu: -2, bouei: -1, nenkin: -1 },
      kaikaku: { shouhizei: -1, chihou: -2, kenpou: 1, keiki: 1, nenkin: 2 },
      shinto: {},
    },

    // 業界団体・支援団体。stance が合えば組織票とお金、合わなければ離れる。
    groups: [
      { id: "ishikai", name: "全国医師連盟", short: "医師会", leader: "asami", issue: "nenkin", want: -1, votes: 2.5, money: 120, intro: "開業医の団体。診療報酬と医療費の抑制に敏感。" },
      { id: "nokyo", name: "農業協同組合中央会", short: "農協", leader: "kizu", issue: "chihou", want: 2, votes: 4, money: 60, intro: "農村の組織票。公共事業と農業予算を求める。" },
      { id: "kensetsu", name: "日本建設業連盟", short: "建設業", leader: "inukai", issue: "chihou", want: 2, votes: 3, money: 200, intro: "ゼネコンと地方の建設会社。公共事業が命綱。" },
      { id: "roso", name: "全国労働組合連合", short: "労組", leader: "aoyagi", issue: "kosodate", want: -2, votes: 4, money: 40, intro: "野党の最大の支持基盤。賃上げと社会保障を求める。" },
      { id: "keizai", name: "日本経済人会議", short: "経済団体", leader: "hyuga", issue: "shouhizei", want: 2, votes: 1, money: 300, intro: "大企業の経営者団体。財政規律と法人減税を求める。献金が大きい。" },
      { id: "shukyo", name: "光和会", short: "宗教団体", leader: "shirakawa", issue: "kenpou", want: -1, votes: 3.5, money: 30, intro: "全国に信者を持つ。選挙のときの動員力が大きい。政教分離の問題がつきまとう。" },
    ],

    ministries: [
      { id: "mof", name: "財務省", short: "財務", top: "takano", desc: "予算と税。省庁の中の省庁。" },
      { id: "mlit", name: "国土交通省", short: "国交", top: "kasai", desc: "道路、港、新幹線。公共事業の元締め。" },
      { id: "mhlw", name: "厚生労働省", short: "厚労", top: null, desc: "年金、医療、子育て。" },
      { id: "meti", name: "経済産業省", short: "経産", top: null, desc: "産業政策とエネルギー。" },
      { id: "mofa", name: "外務省", short: "外務", top: null, desc: "外交と条約。" },
      { id: "mod", name: "防衛省", short: "防衛", top: null, desc: "防衛費と装備。" },
    ],
    issueMinistry: { keiki: "mof", kosodate: "mhlw", bouei: "mod", genpatsu: "meti", shouhizei: "mof", kenpou: null, chihou: "mlit", nenkin: "mhlw" },

    media: [
      { id: "nippo", name: "日報新聞", kind: "新聞", reporter: "aizawa", reach: 3 },
      { id: "tv", name: "全国テレビ", kind: "テレビ", reporter: "gunji", reach: 5 },
      { id: "shinso", name: "週刊真相", kind: "週刊誌", reporter: "hiruta", reach: 3 },
      { id: "sns", name: "SNS", kind: "ネット", reporter: null, reach: 4 },
    ],

    // 名前のある人物。persona は AI の行動と口調に使う。
    // ask = 貸しを使ったときに得られるもの、give = 貸しを作るためにこちらが差し出すもの
    named: [
      { id: "hayase", name: "早瀬 千代子", role: "政策秘書", gender: "f", age: 63, color: "#d4b04c", persona: "mentor", intro: "沢渡事務所であなたを鍛えた秘書。表も裏も知り尽くしている。" },
      { id: "sawatari", name: "沢渡 けんご", role: "元衆議院議員・後援会相談役", gender: "m", age: 74, color: "#8a6a3a", persona: "elder", intro: "あなたの師匠。引退したが、党の長老たちに顔が利く。",
        ask: { kind: "faction_rel", amount: 12, text: "長老たちに口を利いてくれ、派閥との関係が改善した。" }, give: { kind: "money", amount: 200, text: "後援会の運営費を肩代わりした。" } },
      { id: "takuma", name: "沢渡 拓真", role: "衆議院議員（大河内派）", gender: "m", age: 38, color: "#c4524a", persona: "rival", intro: "師匠の長男。あなたとは公認を争った仲。世襲の強みを隠さない。",
        ask: { kind: "members", amount: 1, text: "拓真が若手1人を連れてあなたの会に合流した。" }, give: { kind: "ap", amount: 1, text: "拓真の地元で応援演説をした。" } },
      { id: "iwaki", name: "岩城 正造", role: "岩城建設 社長", gender: "m", age: 68, color: "#7a5c18", persona: "boss", intro: "地元の建設会社の社長で、後援会の大黒柱。見返りを忘れない。",
        ask: { kind: "money", amount: 500, text: "後援会の幹部を通じて、政党支部に500万円の献金が入った。" }, give: { kind: "risk", amount: 10, text: "市の入札で岩城建設に有利になるよう口を利いた。" } },
      { id: "ookouchi", name: "大河内 剛三", role: "協和党総裁・内閣総理大臣", gender: "m", age: 72, color: "#c4524a", persona: "elder", faction: "ookouchi", intro: "党内最大派閥の領袖。数とカネで政権を握ってきた。" },
      { id: "kiryu", name: "桐生 怜子", role: "協和党幹事長", gender: "f", age: 61, color: "#38a394", persona: "schemer", faction: "kiryu", intro: "政策通で、党のカネと公認を握る。計算高い。" },
      { id: "isurugi", name: "石動 慎一郎", role: "前外務大臣", gender: "m", age: 58, color: "#d29a3a", persona: "popular", faction: "isurugi", intro: "テレビ映えする人気者。党員票に強い。" },
      { id: "higa", name: "比嘉 直美", role: "民生連合 代表", gender: "f", age: 54, color: "#4a78c8", persona: "popular", faction: "minsei", intro: "元弁護士。政権交代を狙う野党第一党の顔。" },
      { id: "mashiba", name: "真柴 透", role: "改革の会 代表", gender: "m", age: 49, color: "#7da443", persona: "schemer", faction: "kaikaku", intro: "元市長。身を切る改革を掲げ、都市部で強い。" },
      { id: "kuroda", name: "黒田 要", role: "協和党 国会対策委員長", gender: "m", age: 66, color: "#c4524a", persona: "fixer", faction: "ookouchi", intro: "与党の国対の親分。野党と日程を「握る」のが仕事。",
        ask: { kind: "bill_stage", amount: 1, text: "黒田が野党と日程を握り、あなたの法案が一段階進んだ。" }, give: { kind: "vote_line", amount: 1, text: "党の方針どおりに造反せず採決に加わり、黒田に恩を売った。" } },
      { id: "muroi", name: "室井 さとみ", role: "民生連合 国会対策委員長", gender: "f", age: 57, color: "#4a78c8", persona: "fixer", faction: "minsei", intro: "野党の国対委員長。審議拒否と日程闘争の名人。",
        ask: { kind: "bill_stage", amount: 1, text: "室井が審議に応じ、あなたの法案が一段階進んだ。" }, give: { kind: "concede", amount: 1, text: "野党の求める参考人招致を認め、室井に貸しを作った。" } },
      { id: "takano", name: "鷹野 修", role: "財務省 事務次官", gender: "m", age: 59, color: "#5b6270", persona: "bureaucrat", ministry: "mof", intro: "予算の番人。財政規律を守る議員を好む。",
        ask: { kind: "budget", amount: 150, text: "財務省が予算枠を150億円上積みした。" }, give: { kind: "stance", issue: "keiki", dir: 1, text: "財政規律を支持する発言をして、鷹野の信頼を得た。" } },
      { id: "kasai", name: "葛西 健一", role: "国土交通省 事務次官", gender: "m", age: 60, color: "#5b6270", persona: "bureaucrat", ministry: "mlit", intro: "公共事業の元締め。地方の要望に理解がある。",
        ask: { kind: "works_free", amount: 1, text: "国交省が次の公共事業の費用を負担してくれることになった。" }, give: { kind: "amakudari", amount: 1, text: "国交省OBの再就職先を地元企業に頼んだ。" } },
      { id: "aizawa", name: "相沢 ゆき", role: "日報新聞 政治部 番記者", gender: "f", age: 34, color: "#9ba5b7", persona: "reporter", media: "nippo", intro: "あなたに張り付く番記者。夜討ち朝駆けの常連。",
        ask: { kind: "kill_story", amount: 1, text: "相沢が社内で動き、あなたに関する記事は見送られた。" }, give: { kind: "leak_info", amount: 1, text: "党内の動きをオフレコで伝え、相沢に特ダネを渡した。" } },
      { id: "hiruta", name: "蛭田 誠", role: "週刊真相 記者", gender: "m", age: 45, color: "#9ba5b7", persona: "reporter", media: "shinso", intro: "スキャンダル専門。敵に回すと怖いが、味方にすると便利。",
        ask: { kind: "leak_rival", amount: 1, text: "蛭田がライバル派閥の資金問題を記事にした。" }, give: { kind: "leak_info", amount: 2, text: "ライバルの弱みを蛭田に流した。" } },
      { id: "gunji", name: "郡司 達郎", role: "全国テレビ 政治部長", gender: "m", age: 55, color: "#9ba5b7", persona: "reporter", media: "tv", intro: "討論番組の出演者を決める男。テレビに出れば知名度が跳ねる。",
        ask: { kind: "fame", amount: 8, text: "日曜討論に出演し、知名度が大きく上がった。" }, give: { kind: "money", amount: 100, text: "局の政治部の懇親会の費用を持った。" } },
      { id: "oda", name: "織田 秀明", role: "帝都中央銀行 頭取", gender: "m", age: 64, color: "#2f5d8c", persona: "banker", intro: "メガバンクの頭取。政治家への融資は「将来への投資」だと言う。",
        ask: { kind: "credit", amount: 3000, text: "帝都中央銀行が融資枠を3,000万円広げた。" }, give: { kind: "stance", issue: "shouhizei", dir: 1, text: "金融界の求める財政方針に賛同した。" } },
      { id: "hyuga", name: "日向 大造", role: "日本経済人会議 会長", gender: "m", age: 70, color: "#6b6f2a", persona: "boss", group: "keizai", intro: "財界の総本山。献金は大きいが、見返りに法人減税を求める。",
        ask: { kind: "money", amount: 600, text: "経済人会議から政党支部へ600万円の献金が入った。" }, give: { kind: "stance", issue: "shouhizei", dir: 1, text: "財界の求める税制を支持した。" } },
      { id: "asami", name: "浅見 紘一", role: "全国医師連盟 会長", gender: "m", age: 66, color: "#3f6b5a", persona: "boss", group: "ishikai", intro: "医療費の抑制に反対し、組織票で政治家を動かす。",
        ask: { kind: "votes", amount: 3, text: "医師連盟が地元で組織票をまとめてくれた。" }, give: { kind: "stance", issue: "nenkin", dir: -1, text: "医療費抑制に慎重な立場を取った。" } },
      { id: "kizu", name: "木津 源一", role: "農協中央会 会長", gender: "m", age: 69, color: "#6b6f2a", persona: "boss", group: "nokyo", intro: "農村の票を束ねる。公共事業と農業予算に厳しい目を持つ。",
        ask: { kind: "votes", amount: 4, text: "農協が地元で組織票をまとめてくれた。" }, give: { kind: "stance", issue: "chihou", dir: 1, text: "地方への予算配分を支持した。" } },
      { id: "inukai", name: "犬養 剛", role: "大東組 社長・建設業連盟 会長", gender: "m", age: 62, color: "#7a5c18", persona: "boss", group: "kensetsu", intro: "ゼネコンの総帥。公共事業と献金と票を一本の線でつなぐ。",
        ask: { kind: "money", amount: 400, text: "建設業連盟から献金が入った。" }, give: { kind: "stance", issue: "chihou", dir: 1, text: "公共事業の拡大を支持した。" } },
      { id: "aoyagi", name: "青柳 恵", role: "全国労働組合連合 会長", gender: "f", age: 58, color: "#4a78c8", persona: "boss", group: "roso", intro: "野党の最大の支持基盤。与党議員には冷たいが、政策次第で動く。",
        ask: { kind: "votes", amount: 4, text: "労組が組合員に投票を呼びかけてくれた。" }, give: { kind: "stance", issue: "kosodate", dir: -1, text: "教育無償化の拡大を支持した。" } },
      { id: "shirakawa", name: "白川 慈恩", role: "光和会 会長", gender: "m", age: 71, color: "#8c7a9c", persona: "boss", group: "shukyo", intro: "信者の動員力は選挙で群を抜く。政教分離をめぐる批判もつきまとう。",
        ask: { kind: "votes", amount: 4, text: "光和会の信者が選挙運動を手伝ってくれた。" }, give: { kind: "stance", issue: "kenpou", dir: -1, text: "憲法改正に慎重な姿勢を示した。" } },
      { id: "morita", name: "森田 勝", role: "汐見市長", gender: "m", age: 61, color: "#3f6b5a", persona: "fixer", intro: "あなたの地元の市長。国の予算を取ってくる議員を好む。",
        ask: { kind: "jiban", amount: 10, text: "市長が市内の自治会長を集めて、あなたを支持するよう呼びかけた。" }, give: { kind: "works_req", amount: 1, text: "市の要望する公共事業を国に取り次いだ。" } },
      { id: "narahashi", name: "奈良橋 統", role: "協和党 選挙対策委員長", gender: "m", age: 63, color: "#38a394", persona: "fixer", faction: "kiryu", intro: "公認と選挙区調整の実務を握る。",
        ask: { kind: "candidate_free", amount: 1, text: "奈良橋が新人の公認を優先的に出してくれた。" }, give: { kind: "money", amount: 300, text: "党の選挙基金に拠出した。" } },
      { id: "kuzumi", name: "久住 治", role: "内閣官房副長官", gender: "m", age: 60, color: "#c4524a", persona: "fixer", faction: "ookouchi", intro: "官邸と各省をつなぐ。首相の意向を官僚に伝える役。",
        ask: { kind: "post", amount: 1, text: "久住が官邸であなたを推し、役職が一段上がった。" }, give: { kind: "faction_support", amount: 1, text: "官邸の方針を党内で擁護した。" } },
      { id: "kudo", name: "工藤 進", role: "あなたの会の若手", gender: "m", age: 44, color: "#e0679c", persona: "ally", intro: "最初からの仲間。あなたの会の実務を担う。", ask: null, give: null },
      { id: "tsubaki", name: "椿 美咲", role: "参議院議員・無派閥", gender: "f", age: 47, color: "#8c7a9c", persona: "popular", intro: "参議院の無派閥。テレビの討論で名を上げた。あなたの会に興味を持っている。",
        ask: { kind: "upper_vote", amount: 1, text: "椿が参議院の無派閥議員に声をかけ、法案に賛成してくれた。" }, give: { kind: "ap", amount: 1, text: "椿の勉強会で講演した。" } },
      { id: "oyama", name: "大山 信夫", role: "協和党 元幹事長・最長老", gender: "m", age: 81, color: "#c4524a", persona: "elder", intro: "引退間近の最長老。総裁選の決選投票で、長老の一声は今も効く。",
        ask: { kind: "leader_votes", amount: 15, text: "大山が長老たちをまとめ、総裁選であなたに票を回した。" }, give: { kind: "stance", issue: "kenpou", dir: 1, text: "憲法改正の議論に前向きな姿勢を示した。" } },
      { id: "sawamura", name: "沢村 咲", role: "SNSで人気の若手評論家", gender: "f", age: 31, color: "#9ba5b7", persona: "reporter", media: "sns", intro: "フォロワー200万人。ひと言で世論が動くこともある。",
        ask: { kind: "fame", amount: 5, text: "沢村があなたの政策を動画で紹介し、若い層に広がった。" }, give: { kind: "stance", issue: "kosodate", dir: -1, text: "教育無償化に賛同する発信をした。" } },
    ],

    // 秘書の候補。trait が事件の種になる
    secretaryTraits: [
      { id: "able", name: "有能", desc: "行動力が増える", ap: 1 },
      { id: "loyal", name: "忠実", desc: "辞めても告発しない", loyalBonus: 20 },
      { id: "money", name: "金庫番", desc: "資金集めが得意", money: 40 },
      { id: "local", name: "地元通", desc: "地盤が育ちやすい", jiban: 2 },
      { id: "risky", name: "やり手", desc: "成果は大きいが、勝手に違反をすることがある", ap: 1, risk: 3 },
      { id: "lazy", name: "のんびり", desc: "安いが成果は少ない", salary: -10 },
    ],

    scenarios: [
      { id: "gendai", name: "現代 2027", year: 2027, desc: "協和党の長期政権。派閥の裏金問題のあとで、政治とカネへの目は厳しい。",
        support: { kyowa: 50, minsei: 29, kaikaku: 13 }, ruling: "kyowa", nation: { econ: 50, price: 58, debt: 70, birth: 35 }, cabinetSupport: 44 },
      { id: "saihen", name: "政界再編の嵐", year: 2027, desc: "与党が割れ、改革勢力が伸びる。誰が誰と組むか分からない乱世。新党を立てるなら今。",
        support: { kyowa: 38, minsei: 30, kaikaku: 26 }, ruling: "kyowa", nation: { econ: 42, price: 55, debt: 75, birth: 33 }, cabinetSupport: 28, chaos: true },
      { id: "koutai", name: "政権交代の風", year: 2027, desc: "民生連合が政権を取って2年。期待は失望に変わりつつある。協和党で遊べば野党からの出発。",
        support: { kyowa: 40, minsei: 42, kaikaku: 12 }, ruling: "minsei", nation: { econ: 46, price: 52, debt: 72, birth: 36 }, cabinetSupport: 36 },
    ],

    // 総理のときに起きる危機
    crises: [
      { id: "pandemic", title: "新型感染症の流行", text: "海外で広がった感染症が国内でも急増。病床が足りない。",
        choices: [
          { label: "緊急事態を宣言し、休業補償に大型予算を組む", effects: { support: 6, debt: 6, econ: -6, achievement: 4 }, result: "感染は抑えられたが、国の借金は膨らんだ。" },
          { label: "経済を優先し、宣言は見送る", effects: { support: -8, econ: 2, price: 0 }, result: "病院から悲鳴が上がり、支持率が急落した。" },
        ], omote: "感染症対策の法律にもとづき、首相は緊急事態を宣言できる。休業要請と補償は補正予算で手当てする。", ura: "「危機のとき、総理の言葉は一語ずつ採点される。会見の回数と、表情まで」", law: "新型インフルエンザ等対策特別措置法" },
      { id: "finance", title: "金融危機", text: "海外の大手銀行が破綻し、株価が暴落。地方銀行の経営不安がささやかれる。",
        choices: [
          { label: "公的資金で銀行を支える", effects: { support: -3, econ: 4, debt: 5, achievement: 3 }, result: "銀行は持ちこたえた。「税金で銀行を救うのか」という批判は残った。" },
          { label: "市場に任せる", effects: { support: -6, econ: -8 }, result: "地方銀行が1つ破綻し、地元企業の連鎖倒産が始まった。" },
        ], omote: "金融機関の破綻が連鎖しそうなとき、国は預金保険機構を通じて公的資金を注入できる。", ura: "「地銀が潰れると、その県の政治家は次の選挙で全員落ちる。だから地銀は潰せない」", law: "預金保険法 第102条" },
      { id: "diplomacy", title: "隣国との緊張", text: "隣国の艦船が領海に侵入し、漁船と衝突した。世論は強硬論に傾いている。",
        choices: [
          { label: "抗議しつつ、首脳会談で沈静化を図る", effects: { support: 2, achievement: 3 }, result: "首脳会談は実現し、緊張は和らいだ。強硬派からは「弱腰」と言われた。" },
          { label: "防衛費の緊急増額を表明する", effects: { support: 5, debt: 4, issueShift: { bouei: 1 } }, result: "支持率は上がったが、財源は国債だった。" },
        ], omote: "外交は内閣の仕事（憲法73条）。条約の締結には国会の承認がいる。", ura: "「外交で支持率は上がる。でも外交で落ちた政権はもっと多い」", law: "日本国憲法 第73条" },
      { id: "quake", title: "大地震", text: "大都市を直下型地震が襲った。死者多数、交通は寸断。",
        choices: [
          { label: "ただちに現地対策本部を置き、補正予算を組む", effects: { support: 5, debt: 6, achievement: 5 }, result: "初動は評価された。復興は何年も続く。" },
          { label: "既存の予算で対応し、追加の借金は避ける", effects: { support: -7, debt: 1 }, result: "「冷たい政権」という言葉が広がった。" },
        ], omote: "災害対策基本法にもとづき、政府は緊急災害対策本部を置ける。激甚災害に指定されると国の補助率が上がる。", ura: "「初動の3日間で政権の評価が決まる。総理が現地に行くかどうかも、計算のうち」", law: "災害対策基本法・激甚災害法" },
      { id: "minister", title: "閣僚の政治資金疑惑", text: "週刊誌が、あなたの内閣の大臣の政治資金の不記載を報じた。野党は辞任を要求。",
        choices: [
          { label: "すぐに更迭する", effects: { support: -2, cabinetRel: -8 }, result: "傷は浅く済んだ。大臣を出した派閥は不満を持った。" },
          { label: "本人の説明を待つ", effects: { support: -8 }, result: "説明は二転三転し、3週間後に辞任。支持率は大きく下がった。" },
        ], omote: "大臣の任免は首相の権限（憲法68条）。", ura: "「辞任のタイミングを逃すと、辞任ドミノが始まる」", law: "日本国憲法 第68条" },
    ],

    // 教科書の評価文（最後に表示）
    evaluation: {
      integrity: [
        [80, "清廉な政治家として知られ、政治とカネの問題で名前が挙がることはなかった。"],
        [50, "グレーな資金の扱いが時折問題になったが、決定的な疑惑には至らなかった。"],
        [0, "政治資金をめぐる疑惑がつきまとい、在任中も後世も「カネの政治家」と評された。"],
      ],
      achievement: [
        [70, "数々の法案を成立させ、公共事業と政策で地方と国の姿を変えた実行力は、後世に高く評価された。"],
        [35, "いくつかの政策を実現したが、大きな改革には至らなかった。"],
        [0, "権力の座に近づくことには長けていたが、何を成し遂げたかを問われると、答えに窮する。"],
      ],
      popularity: [
        [60, "国民の支持は厚く、国の指標も改善した。"],
        [35, "支持は安定せず、暮らしの指標も横ばいだった。"],
        [0, "国民の暮らしは悪化し、政権末期の支持率は低迷した。"],
      ],
    },
  };
})();
