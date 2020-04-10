/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { observer } from "mobx-react";
import { Stack, mergeStyles, getTheme, AnimationStyles, DefaultButton } from "office-ui-fabric-react";
import * as React from "react";
import { NetworkViewModel } from "../ViewModels/NetworkViewModel";
import { Transition } from "react-transition-group";
export interface LoadProgressProps {
  vm: NetworkViewModel;
}

const theme = getTheme();
const progressBoxStyle = {
  padding: 8,
  background: "#ffffff90",
};

const progressStyleFadeIn = mergeStyles(AnimationStyles.fadeIn400, {
  boxShadow: theme.effects.elevation16,
});
const progressStyleFadeOut = mergeStyles(AnimationStyles.fadeOut400, {
  boxShadow: theme.effects.elevation16,
});

export class LoadProgress extends React.Component<LoadProgressProps> {
  onCancel = () => {
    this.props.vm.requestCancelLoad();
  };
  onResume = () => {
    this.props.vm.resumeLoad();
  };
  getTransitionClass(state: string) {
    switch (state) {
      case "entering":
        return progressStyleFadeIn;
      case "exiting":
        return progressStyleFadeOut;
      default:
        return undefined;
    }
  }
  render() {
    const { progressText, isLoading, cancelRequested, isPaused } = this.props.vm;
    return (
      <>
        <Transition in={isLoading || isPaused} timeout={500} classNames="my-node">
          {state =>
            state != "exited" && (
              <Stack style={progressBoxStyle} className={this.getTransitionClass(state)}>
                <Stack.Item>{progressText}</Stack.Item>
                {isLoading && (
                  <Stack.Item>
                    {!cancelRequested && <DefaultButton text="Cancel" onClick={this.onCancel}></DefaultButton>}
                  </Stack.Item>
                )}
                {isPaused && (
                  <Stack.Item>
                    {!cancelRequested && <DefaultButton text="Resume" onClick={this.onResume}></DefaultButton>}
                  </Stack.Item>
                )}
              </Stack>
            )
          }
        </Transition>
      </>
    );
  }
}

observer(LoadProgress);
