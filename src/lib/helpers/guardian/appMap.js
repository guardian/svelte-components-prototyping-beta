// feel free to edit these and add to them

const appMap = {
    header: {
      app: "#article-header",
      desktop: "article.content--interactive",
    },
    title: {
      app: ".content__labels",
      desktop: '[data-gu-name="title"]',
    },
    titleText: {
      app: ".article-kicker__series",
      desktop: ".content__labels > div > div",
    },
    headline: {
      app: "#headline",
      desktop: '[data-gu-name="headline"]',
    },
    standfirst: {
      app: ".standfirst",
      desktop: '[data-gu-name="standfirst"]',
    },
    media: {
      app: "#main-media",
      desktop: '[data-gu-name="media"]',
    },
    meta: {
      app: "#meta",
      desktop: '[data-gu-name="meta"]',
    },
    metaText: {
      app: ".meta__published",
      desktop: ".content__meta-container_dcr > div > div",
    },
    byline: {
      app: ".meta__byline",
      desktop: '[data-component="meta-byline"]',
    },
    bylineTwo: {
      app: "div.byline",
      desktop: '[data-component="meta-byline"]',
    },
    articleBody: {
      app: "#article-body > div",
      desktop: "div.content--interactive > div",
    },
    articleHeader: {
      app: "#feature-header",
      desktop: "div.content--interactive > div",
    },
    bodyText: {
      app: ".article__body .element-atom + p",
      desktop: '[data-gu-name="body"] .element-atom + p',
    },
    inlineImage: {
      app: ".element--inline",
      desktop: ".element-inline",
    },
    showcaseImage: {
      app: ".element--showcase",
      desktop: ".element-showcase",
    },
    immersiveImage: {
      app: ".element--immersive",
      desktop: ".element-immersive",
    },
    supportingImage: {
      app: ".element--supporting",
      desktop: ".element-supporting",
    },
    thumbnailImage: {
      app: ".element--thumbnail",
      desktop: ".element-thumbnail",
    },
    lines: {
      app: ".keyline-4",
      desktop: '[data-gu-name="lines"]',
    },
    featureBody: {
      app: "#article-body",
      desktop: '[data-gu-name="body"]',
    },
  };
  
  export default appMap;
  