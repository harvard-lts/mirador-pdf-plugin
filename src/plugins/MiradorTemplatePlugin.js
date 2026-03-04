import React, { Component } from 'react';
import { getManifestoInstance } from 'mirador/dist/es/src/state/selectors/manifests';

const mapStateToProps = (state, { windowId }) => ({
  manifestId: (getManifestoInstance(state, { windowId }) || {}).id,
  manifest: getManifestoInstance(state, { windowId }),
});

class miradorTemplate extends Component {
  render() {

    return (
      <></>
    );
  }

  componentDidMount() {
    // Add custom stuff here
  }
}

export default {
  target: 'Window',
  mode: 'add',
  component: miradorTemplate,
  mapStateToProps,
}