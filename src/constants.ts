export const btnArrowHtml = (onClick: string, style?: string) => `<div id="hostpot2" class="arrow" ${
  style ? `style="${style}"` : ''
} onclick="${onClick}" ontouchstart="${onClick}">
<lottie-player src="static/lottie/arrow.json" background="transparent" speed="1" loop autoplay></lottie-player>
</div>`;
