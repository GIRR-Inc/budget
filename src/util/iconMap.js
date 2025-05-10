import composeIcon from "../assets/icons/compose.png";
import mcdonald from "../assets/icons/mcdonald.jpg";
import megaCoffe from "../assets/icons/megaCoffe.png";
import starbucks from "../assets/icons/starbucks.png";
import theVenti from "../assets/icons/theVenti.png";
import ediya from "../assets/icons/ediya.png";

export const keywordIconMap = {
  컴포즈: composeIcon,
  맥도날드: mcdonald,
  메가커피: megaCoffe,
  스타벅스: starbucks,
  더벤티: theVenti,
  이디야: ediya,
  // 필요 시 추가
};

export const getMatchedIcon = (memo = "") => {
  for (const keyword in keywordIconMap) {
    if (memo.includes(keyword)) {
      return keywordIconMap[keyword];
    }
  }
  return null;
};
