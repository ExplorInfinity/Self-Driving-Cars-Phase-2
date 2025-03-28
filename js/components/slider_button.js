export default function slider_button(value, {checked=false}={}) {
    const sliderContainer = document.createElement('label');
    sliderContainer.classList.add('switch');

    const input = document.createElement('input');
    input.setAttribute('type', 'checkbox');
    input.setAttribute('name', 'checkbox');
    input.checked = checked;
    input.value = value;

    const slider = document.createElement('div');
    slider.classList.add('slider', 'round');

    sliderContainer.appendChild(input);
    sliderContainer.appendChild(slider);

    return [
        sliderContainer, 
        () => input.checked
    ]
}