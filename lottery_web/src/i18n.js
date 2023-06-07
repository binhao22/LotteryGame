import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguaeDetector from "i18next-browser-languagedetector";

i18n
  .use(LanguaeDetector) // 사용자 언어 탐지
  .use(initReactI18next) // i18n 객체를 react-18next에 전달
  .init({
    // for all options read: https://www.i18next.com/overview/configuration-options
    debug: true,
    fallbackLng: "en",
    interpolation: {
        escapeValue: false,
    },
    resources: {
        en: {
            translation: { // 번역본 쓸 공간
                description: {
                    title : "Lottery Game",
                    pot: "Pot Money :",
                    num: "Your Number",
                    bet: "BET",
                    table_1: "No.",
                    table_2: "Address",
                    table_3: "Challenge",
                    table_4: "Answer",
                    table_5: "Amount",
                    table_6: "Result",
                    table_7: "AnswerBlockNumber",
                    rule: "Rule",
                    contact: "Contact",
                    st_1: "Users can access the DApp through the Metamask wallet.",
                    st_2: "Users can select two cards of their choice and enter the lottery numbers they want to bet.",
                    st_3: "The bet amount for one lottery ticket is fixed at 0.005 ETH.",
                    st_4: "The winner is determined by comparing the number selected by the user with the two numbers preceding the hash value of the block of the lottery (generated three times after the block).",
                    st_5: "Win : If the two digits and sequence of the lottery number match, the winner is awarded the full prize amount.",
                    st_6: "DRAW : If only one of the two digits and order match, only the ticket purchase amount is returned to the user.",
                    st_7: "FAIL : If both digits and order of the draw number are different, the ticket purchase amount is added to the prize pool.",
                    st_8: "E-mail : 1820161028@bit.edu.cn",
                    st_9: "Address : Beijing Institute of Technology No.5 Yard, Zhong Guan Cun South StreetHaidian District, Beijing",
                },
            },
        },
        ch: {
            translation: { // 번역본 쓸 공간
                description: {
                    title : "彩票游戏",
                    pot: "奖金池 :",
                    num: "选择号码",
                    bet: "购票",
                    table_1: "编号",
                    table_2: "钱包地址",
                    table_3: "彩票号码",
                    table_4: "开奖号码",
                    table_5: "金额",
                    table_6: "开奖结果",
                    table_7: "开奖区块号码",
                    rule: "开奖规则",
                    contact: "联系我们",
                    st_1: "用户可以通过Metamask钱包链接DApp。",
                    st_2: "用户可以通过选择两张自己喜欢的卡片，输入自己想要购买的彩票号码。",
                    st_3: "一张购票金额固定为0.005ETH。",
                    st_4: "通过比较用户选择的数字与开奖的区块哈希值（自现区块后第三个生成的区块）前面的两个数字来决定中将人。",
                    st_5: "WIN ： 如果开奖号码的两个数字和顺序匹配，则中将人将获得全额奖金。",
                    st_6: "DRAW ： 如果两个数字中只有一个数字和顺序匹配，则只有购票金额返回给用户。",
                    st_7: "FAIL ： 如果开奖号码的两个数字和顺序都不匹配，则购票金额将被加入奖金池里。",
                    st_8: "邮箱 : 1820161028@bit.edu.cn",
                    st_9: "地址 : 北京市海淀区中关村南大街5号北京理工大学",
                },
            },
        },
        ko: {
            translation: { // 번역본 쓸 공간
                description: {
                    title : "로또 게임",
                    pot: "상금 풀 :",
                    num: "선택한 번호",
                    bet: "배팅",
                    table_1: "번호",
                    table_2: "지갑 주소",
                    table_3: "추첨 번호",
                    table_4: "당첨 번호",
                    table_5: "금액",
                    table_6: "추첨 결과",
                    table_7: "추첨 블록 번호",
                    rule: "로또 규칙",
                    contact: "연락처",
                    st_1: "유저는 메타마스크 지갑을 통해 DApp 에 연결할 수 있다.",
                    st_2: "유저는 원하는 카드 두 장을 선택해서, 구매를 원하는 복권 번호를 입력할 수 있다.",
                    st_3: "복권 1회 구매 금액은 0.005 ETH 로 고정이다.",
                    st_4: "유저가 선택한 번호와 추첨 블록(해당 블록보다 3번째 뒤에 생성되는 블록)의 블록해시값 앞 두 번호를 비교해서 당첨 여부를 결정한다.",
                    st_5: "WIN : 추첨 번호 두자리 숫자와 순서가 모두 일치하면,  상금 풀의 금액을 전부 당첨자에게 지급한다.",
                    st_6: "DRAW : 추첨 번호 두자리 숫자와 순서가 하나만 일치하면, 구매 금액만 유저에게 반환한다.",
                    st_7: "FAIL : 추첨 번호 두자리 숫자와 순서가 모두 일치하지 않으면, 구매 금액은 상금 풀에 누적된다.",
                    st_8: "이메일 : 1820161028@bit.edu.cn",
                    st_9: "주소 : 北京市海淀区中关村南大街5号北京理工大学",
                },
            },
        },
    },
});

export default i18n;