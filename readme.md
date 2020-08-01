# Sending data from DHT22 sensor on Raspberry Pi 3 to BigQuery

### Running the app

SSH to your PI

Add your certficates to `certs` folder

Use [tmux](https://www.hamvocke.com/blog/a-quick-and-easy-guide-to-tmux/) to create a persistent session:

* In terminal run `tmux`

* Start your app `npm run start`

* To detach tmux session (so your app does not stop running after SSH session is done with), `Ctrl+b`, then `d`

* To return to your session, execute `tmux attach -t 0`
