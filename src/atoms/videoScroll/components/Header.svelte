<script>
    import { isMuted, toggleMuted } from '$lib/stores/videoScroll.js'

    let { headline, standfirst, tag } = $props()
</script>

<div class="header-wrapper">
    <div class="interactive-header-wrapper">
        <div class="int-tag">{tag}</div>
        <div class="headline-wrapper">
            <h1><span class="highlighted">{headline}</span></h1>
        </div>
        <p class="standfirst"><span>{standfirst}</span></p>
        
        <div id="audio-prompt-container" class:sound-off={$isMuted} on:click={toggleMuted}>
            <div class="audio-prompt">
                This feature is best experienced with sound. <strong><span></span></strong>
            </div>
        </div>

        <div id="start-playing-video">
            <div class="start-prompt">Click to play</div>
            <div class="manual video_pause"></div>
        </div>
    </div>
</div>

<style lang="scss">
    .header-wrapper {
        position: relative;
        background-size: cover;
        background-position: center;
        font-size: 24px;
        line-height: 2px;
        font-family: "Guardian Headline", "Guardian Egyptian Web", "Guardian Headline Full", Georgia, serif;
        font-weight: 900;

        @include mq($until: tablet) {
            padding-right: 40px;
            margin-left: 10px;
        }

        @include mq($from: tablet, $until: desktop) {
            padding-right: 40px;
            margin-left: 10px;
        }

        @include mq($from: desktop, $until: wide) {
            margin-left: 250px;
        }

        @include mq($from: wide) {
            margin-left: 350px;
        }

        .interactive-header-wrapper {
            margin: auto;
            box-sizing: border-box;

            @include mq($until: tablet) {
                max-width: 740px;
                padding-top: 10vh;
            }

            @include mq($from: tablet, $until: desktop) {
                max-width: 960px;
                padding-top: 15vh;
            }

            @include mq($from: desktop, $until: wide) {
                max-width: 1140px;
                padding-top: 20vh;
            }

            @include mq($from: wide) {
                max-width: 1300px;
                padding-top: 25vh;
            }

            .highlighted {
                background: #c70000;
                padding: 0 0.2em;
                color: white;
                display: inline;
                box-decoration-break: clone;
                -webkit-box-decoration-break: clone;
            }

            .int-tag {
                font-size: 18px;
                line-height: 24px;
                font-family: inherit;
                font-weight: 900;
                color: black;
                background-color: white;
                display: inline-block;
                padding: 0.2em 0.5em;
            }

            .headline-wrapper {
                width: 100%;
                padding: 0;
                max-width: 680px !important;

                h1 {
                    font-family: inherit;
                    font-weight: 900;
                    line-height: 1.24;
                    margin: 0;
                    color: #fff;
                    pointer-events: none;

                    @include mq($until: mobileLandscape) {
                        font-size: 26px;
                    }

                    @include mq($from: mobileLandscape, $until: tablet) {
                        font-size: 30px;
                    }

                    @include mq($from: tablet, $until: desktop) {
                        font-size: 34px;
                    }

                    @include mq($from: desktop) {
                        font-size: 44px;
                    }
                }
            }

            .standfirst {
                font-family: inherit;
                font-weight: 300;
                font-style: italic;
                font-size: 20px;
                line-height: 26px;
                display: block;
                margin-top: 0px;
                color: #000;
                max-width: 410px !important;
                opacity: 0.7;

                @include mq($from: desktop) {
                    font-size: 24px;
                    line-height: 30px;
                }

                span {
                    padding: 0 0.1em;
                    background: grey;
                    color: white;
                    display: inline;
                    box-decoration-break: clone;
                    -webkit-box-decoration-break: clone;
                }
            }
        }
    }

    .audio-prompt {
        font-weight: 400;

        span::before {
            content: "Turn audio off";
        }
    }

    .sound-off .audio-prompt span::before {
        content: "Turn audio on";
    }

    #audio-prompt-container {
        display: inline-block;
        margin-left: -10px;
        background-color: black;
        margin-top: 20px;
        cursor: pointer;
        padding: 8px;
        font-size: 14px;
        line-height: 20px;
        font-family: "Guardian Text Egyptian Web", Georgia, serif;

        span {
            color: #c70000;
            font-weight: 700;
        }
    }

    #start-playing-video {
        display: none;
        margin-left: -10px;
        background-color: black;
        margin-top: 20px;
        cursor: pointer;
        font-size: 14px;
        line-height: 20px;
        font-family: "Guardian Text Egyptian Web", Georgia, serif;

        span {
            color: #c70000;
            font-weight: 700;
        }
    }

    .start-prompt {
        float: left;
        height: 44px;
        line-height: 44px;
        padding: 0 20px;
    }
</style>