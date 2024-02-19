export const btnArrowHtml = (onClick: string, style?: string) => `<div class="arrow" ${
  style ? `style="${style}"` : ''
} onclick="${onClick}" ontouchend="${onClick}">
<lottie-player src="static/lottie/arrow.json" background="transparent" speed="1" loop autoplay></lottie-player>
<div class="title-marker">
  Basic Floor
</div>
</div>`;
