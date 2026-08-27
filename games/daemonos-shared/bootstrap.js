export async function mount(factory){const app=factory();document.getElementById("game-root").append(app.content);return app}
