const GENDER_WORDS = {
  men: "men",
  mens: "men",
  man: "men",
  women: "women",
  womens: "women",
  woman: "women",
  female: "women",
};

function singularize(word) {
  if (GENDER_WORDS[word]) return GENDER_WORDS[word];
  if (word.endsWith("ies") && word.length > 4) return `${word.slice(0, -3)}y`;
  if (
    word.endsWith("ches") ||
    word.endsWith("shes") ||
    word.endsWith("xes") ||
    word.endsWith("zes") ||
    word.endsWith("sses")
  ) {
    return word.slice(0, -2);
  }
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) {
    return word.slice(0, -1);
  }
  return word;
}

function searchWords(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .match(/[a-z0-9]+/g) || [];
}

export function productMatchesSearch(product, query, categoryText = "") {
  const queryWords = searchWords(query);
  if (!queryWords.length) return true;

  const name =
    product?.name ||
    product?.title ||
    product?.product_name ||
    product?.productName ||
    "";
  const gender = [
    product?.gender,
    product?.target_gender,
    product?.for_gender,
    product?.audience,
    product?.department,
  ]
    .filter(Boolean)
    .join(" ");
  const productWords = searchWords(`${name} ${categoryText} ${gender}`);
  const canonicalWords = new Set(productWords.map(singularize));

  return queryWords.every((word) => {
    if (GENDER_WORDS[word]) return canonicalWords.has(GENDER_WORDS[word]);
    const canonicalWord = singularize(word);
    return (
      canonicalWords.has(canonicalWord) ||
      productWords.some(
        (productWord) =>
          productWord.includes(word) || productWord.includes(canonicalWord)
      )
    );
  });
}
